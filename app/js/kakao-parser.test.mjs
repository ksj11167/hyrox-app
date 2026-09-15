import assert from 'node:assert/strict';
import { parseKakaoExport, buildCandidates, guessRoomType, groupByDay } from './kakao-parser.js';

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok  ' + name);
  } catch (e) {
    console.error('  FAIL ' + name + '\n       ' + e.message);
    process.exitCode = 1;
  }
}

const ANDROID = `저장한 날짜 : 2024-03-11 22:14:03

개발3팀 님과 카카오톡 대화
--------------- 2024년 3월 11일 월요일 ---------------
[박팀장] [오전 9:12] 세진님 어제 그 배포 건 어떻게 됐어요?
[김세진] [오전 9:15] 팀장님 그거 오늘까지 되나요?
[김세진] [오전 9:15] 지금 QA 돌리는 중입니다
[박팀장] [오전 9:16] 네 오늘까지 부탁드립니다
[김세진] [오전 9:17] 넵
[김세진] [오전 9:40] 방금 확인했는데
문제 하나 있어서 좀 늦어질 것 같습니다
죄송합니다
[박팀장] [오전 9:41] 사진
--------------- 2024년 3월 12일 화요일 ---------------
[김세진] [오후 2:03] 이모티콘
[김세진] [오후 2:05] 배포 완료했습니다!
`;

const IOS = `저장한 날짜 : 2024-03-11 22:14:03

2024년 3월 11일 오전 9:12, 박팀장 : 세진님 어제 그 배포 건 어떻게 됐어요?
2024년 3월 11일 오전 9:15, 김세진 : 팀장님 그거 오늘까지 되나요?
2024년 3월 11일 오전 9:41, 박팀장 : 사진
2024년 3월 12일 오후 2:05, 김세진 : 배포 완료했습니다!
`;

test('android: format detected', () => {
  assert.equal(parseKakaoExport(ANDROID).format, 'android');
});

test('android: room title extracted', () => {
  assert.equal(parseKakaoExport(ANDROID).roomTitle, '개발3팀');
});

test('android: speakers counted, most frequent first', () => {
  const { speakers } = parseKakaoExport(ANDROID);
  assert.equal(speakers[0].name, '김세진');
  assert.equal(speakers[0].count, 6);
  assert.equal(speakers[1].name, '박팀장');
  assert.equal(speakers[1].count, 3);
});

test('android: multi-line message stays one message', () => {
  const { messages } = parseKakaoExport(ANDROID);
  const long = messages.find((m) => m.text.startsWith('방금 확인했는데'));
  assert.ok(long, 'multi-line message missing');
  assert.equal(long.text, '방금 확인했는데\n문제 하나 있어서 좀 늦어질 것 같습니다\n죄송합니다');
});

test('android: date banner carried onto messages', () => {
  const { messages } = parseKakaoExport(ANDROID);
  assert.equal(messages[0].date, '2024년 3월 11일');
  assert.equal(messages[messages.length - 1].date, '2024년 3월 12일');
});

test('android: am/pm converted to minutes past midnight', () => {
  const { messages } = parseKakaoExport(ANDROID);
  assert.equal(messages[0].minutes, 9 * 60 + 12);
  assert.equal(messages[messages.length - 1].minutes, 14 * 60 + 5);
});

test('media placeholders flagged, not dropped', () => {
  const { messages } = parseKakaoExport(ANDROID);
  const photo = messages.find((m) => m.text === '사진');
  const emoji = messages.find((m) => m.text === '이모티콘');
  assert.equal(photo.media, true);
  assert.equal(emoji.media, true);
});

test('ios: format detected and messages parsed', () => {
  const p = parseKakaoExport(IOS);
  assert.equal(p.format, 'ios');
  assert.equal(p.messages.length, 4);
  assert.equal(p.messages[1].speaker, '김세진');
  assert.equal(p.messages[1].text, '팀장님 그거 오늘까지 되나요?');
});

test('ios: date derived from each line', () => {
  const p = parseKakaoExport(IOS);
  assert.equal(p.messages[0].date, '2024년 3월 11일');
  assert.equal(p.messages[3].date, '2024년 3월 12일');
});

test('system notices skipped, not treated as speech', () => {
  const p = parseKakaoExport(
    '[김세진] [오전 9:15] 안녕하세요\n박신입님이 들어왔습니다.\n[김세진] [오전 9:16] 반갑습니다\n',
  );
  assert.equal(p.messages.length, 2);
  assert.equal(p.skipped, 1);
});

test('candidates: only my own non-media text, conversation order preserved', () => {
  const p = parseKakaoExport(ANDROID);
  const c = buildCandidates(p, '김세진');
  assert.deepEqual(
    c.map((x) => x.ko),
    [
      '팀장님 그거 오늘까지 되나요?',
      '지금 QA 돌리는 중입니다',
      '넵',
      '방금 확인했는데\n문제 하나 있어서 좀 늦어질 것 같습니다\n죄송합니다',
      '배포 완료했습니다!',
    ],
  );
});

test('candidates: context carries the other party, which is what resolves 그거', () => {
  const p = parseKakaoExport(ANDROID);
  const c = buildCandidates(p, '김세진');
  const first = c[0];
  assert.equal(first.context.length, 1);
  assert.equal(first.context[0].speaker, '박팀장');
  assert.equal(first.context[0].mine, false);
  assert.match(first.context[0].text, /배포 건/);
});

test('candidates: context window bounded and ordered oldest first', () => {
  const p = parseKakaoExport(ANDROID);
  const c = buildCandidates(p, '김세진', { contextTurns: 2 });
  const deployed = c.find((x) => x.ko === '배포 완료했습니다!');
  assert.ok(deployed.context.length <= 2);
  const qa = c.find((x) => x.ko === '지금 QA 돌리는 중입니다');
  assert.equal(qa.context[qa.context.length - 1].text, '팀장님 그거 오늘까지 되나요?');
});

test('candidates: nothing is dropped for being short or repetitive', () => {
  const p = parseKakaoExport(ANDROID);
  const c = buildCandidates(p, '김세진');
  assert.ok(c.some((x) => x.ko === '넵'), 'short utterance was filtered — deck must stay uncurated');
});

test('candidates: context never crosses a date boundary', () => {
  const c = buildCandidates(parseKakaoExport(ANDROID), '김세진');
  const firstOfDay2 = c.find((x) => x.date === '2024년 3월 12일');
  assert.ok(firstOfDay2, 'expected a card on the second day');
  for (const ctx of firstOfDay2.context) {
    assert.ok(
      !/고생|주말/.test(ctx.text),
      'context leaked from the previous day: ' + ctx.text,
    );
  }
  const sameDayOnly = buildCandidates(
    parseKakaoExport(
      '--------------- 2024년 3월 11일 월요일 ---------------\n' +
      '[박팀장] [오후 11:58] 내일 봐요\n' +
      '--------------- 2024년 3월 12일 화요일 ---------------\n' +
      '[김세진] [오전 9:01] 안녕하세요\n',
    ),
    '김세진',
  );
  assert.equal(sameDayOnly[0].context.length, 0, 'yesterday must not be context for today');
});

test('days: one deck per calendar day, newest first', () => {
  const days = groupByDay(buildCandidates(parseKakaoExport(ANDROID), '김세진'));
  assert.equal(days.length, 2);
  assert.equal(days[0].date, '2024년 3월 12일');
  assert.equal(days[1].date, '2024년 3월 11일');
});

test('days: every utterance survives the split — nothing curated away', () => {
  const cands = buildCandidates(parseKakaoExport(ANDROID), '김세진');
  const days = groupByDay(cands);
  const total = days.reduce((n, d) => n + d.cards.length, 0);
  assert.equal(total, cands.length);
});

test('days: a day deck is small enough to finish in one sitting', () => {
  const days = groupByDay(buildCandidates(parseKakaoExport(ANDROID), '김세진'));
  assert.equal(days[0].cards.length, 1);
  assert.equal(days[1].cards.length, 4);
});

test('days: undated messages land in their own bucket, sorted last', () => {
  const days = groupByDay([
    { id: 'a', ko: '하나', date: '2024년 3월 11일' },
    { id: 'b', ko: '둘', date: null },
  ]);
  assert.equal(days.length, 2);
  assert.equal(days[days.length - 1].date, '날짜 미상');
});

test('room type: honorific-heavy room reads as business', () => {
  assert.equal(guessRoomType(parseKakaoExport(ANDROID)), 'business');
});

test('room type: casual room reads as casual', () => {
  const casual = parseKakaoExport(
    '[민수] [오후 8:01] 야 오늘 뭐함\n[세진] [오후 8:02] 그냥 집\n[세진] [오후 8:02] 너는?\n',
  );
  assert.equal(guessRoomType(casual), 'casual');
});

test('empty input does not throw', () => {
  const p = parseKakaoExport('');
  assert.equal(p.messages.length, 0);
  assert.equal(p.speakers.length, 0);
  assert.equal(p.format, 'unknown');
});

test('unparseable input is reported rather than silently accepted', () => {
  const p = parseKakaoExport('this is not a kakao export\njust some lines\n');
  assert.equal(p.format, 'unknown');
  assert.equal(p.messages.length, 0);
  assert.ok(p.skipped >= 2);
});

console.log(`\n${passed} passed`);
