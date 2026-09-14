/**
 * KakaoTalk chat export parser.
 *
 * Kakao offers no API for reading conversations, so the only supported path is
 * the app's own "대화 내보내기" (export) which produces a .txt file. The format
 * differs by platform and has changed over time, so we detect per line rather
 * than committing to one grammar for the whole file.
 *
 * Recognised message forms:
 *   Android   [이름] [오전 9:15] 메시지
 *   iOS       2024년 1월 15일 오전 9:15, 이름 : 메시지
 *   iOS alt   2024. 1. 15. 오전 9:15, 이름 : 메시지
 *
 * Anything that matches none of them and is not a date banner or system notice
 * is treated as a continuation of the previous message, because Kakao exports
 * multi-line messages as raw newlines with no escaping.
 */

const RE_ANDROID = /^\[([^\]]{1,60})\]\s*\[(오전|오후)\s*(\d{1,2}):(\d{2})\]\s?([\s\S]*)$/;
const RE_IOS = /^(\d{4})[.년]\s*(\d{1,2})[.월]\s*(\d{1,2})[.일]?\s+(오전|오후)\s*(\d{1,2}):(\d{2}),\s*([^:]{1,60}?)\s*:\s?([\s\S]*)$/;
const RE_DATE_BANNER = /^-{3,}\s*(.+?)\s*-{3,}$/;
const RE_SAVED_HEADER = /^(저장한 날짜|Date Saved)\s*:/;
const RE_ROOM_TITLE = /^(.+?)\s*님과 카카오톡 대화$|^(.+?)\s*카카오톡 대화$/;

/** Kakao writes these itself; they are not anybody's speech. */
const RE_SYSTEM = /(님이 (들어왔|나갔)습니다|님을 초대했습니다|채팅방 관리자가|운영정책을 위반|삭제된 메시지입니다|메시지를 가져올 수 없습니다)/;

/** Placeholders Kakao substitutes for non-text content. */
const MEDIA_TOKENS = new Set([
  '사진', '동영상', '이모티콘', '음성메시지', '삭제된 메시지입니다.',
  '(이모티콘)', '선물', '송금', '지도', '연락처', '일정',
]);

function isMedia(text) {
  const t = text.trim();
  if (MEDIA_TOKENS.has(t)) return true;
  if (/^사진\s+\d+장$/.test(t)) return true;
  if (/^파일\s*:/.test(t)) return true;
  return false;
}

function toMinutes(ampm, hour, minute) {
  let h = hour % 12;
  if (ampm === '오후') h += 12;
  return h * 60 + minute;
}

/**
 * @param {string} raw contents of the exported .txt
 * @returns {{roomTitle: string|null, speakers: {name: string, count: number}[],
 *            messages: {speaker: string, text: string, date: string|null,
 *                       minutes: number|null, media: boolean}[],
 *            skipped: number, format: 'android'|'ios'|'mixed'|'unknown'}}
 */
export function parseKakaoExport(raw) {
  const lines = String(raw).replace(/\r\n?/g, '\n').split('\n');
  const messages = [];
  let roomTitle = null;
  let currentDate = null;
  let skipped = 0;
  let sawAndroid = false;
  let sawIos = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === '') {
      // A blank line inside a message is real content; outside one it is noise.
      if (messages.length > 0 && messages[messages.length - 1]._open) {
        messages[messages.length - 1].text += '\n';
      }
      continue;
    }

    if (RE_SAVED_HEADER.test(line)) continue;

    const banner = line.match(RE_DATE_BANNER);
    if (banner) {
      // Android banners carry the weekday ("2024년 3월 11일 월요일"); drop it so
      // dates compare equal to the iOS form.
      currentDate = banner[1].replace(/\s*[월화수목금토일]요일$/, '');
      closeAll(messages);
      continue;
    }

    if (roomTitle === null) {
      const title = line.match(RE_ROOM_TITLE);
      if (title) {
        roomTitle = (title[1] || title[2] || '').trim() || null;
        continue;
      }
    }

    const android = line.match(RE_ANDROID);
    if (android) {
      sawAndroid = true;
      closeAll(messages);
      const [, speaker, ampm, hh, mm, text] = android;
      push(messages, speaker.trim(), text, currentDate, toMinutes(ampm, +hh, +mm));
      continue;
    }

    const ios = line.match(RE_IOS);
    if (ios) {
      sawIos = true;
      closeAll(messages);
      const [, y, mo, d, ampm, hh, mm, speaker, text] = ios;
      const date = `${y}년 ${+mo}월 ${+d}일`;
      currentDate = date;
      push(messages, speaker.trim(), text, date, toMinutes(ampm, +hh, +mm));
      continue;
    }

    if (RE_SYSTEM.test(line)) {
      skipped++;
      continue;
    }

    // Continuation of the message above, or unattributable noise before any.
    if (messages.length > 0 && messages[messages.length - 1]._open) {
      messages[messages.length - 1].text += '\n' + line;
    } else {
      skipped++;
    }
  }

  closeAll(messages);

  for (const m of messages) {
    m.text = m.text.replace(/\n+$/, '');
    m.media = isMedia(m.text);
    delete m._open;
  }

  const kept = messages.filter((m) => m.text.trim() !== '');
  const counts = new Map();
  for (const m of kept) counts.set(m.speaker, (counts.get(m.speaker) || 0) + 1);
  const speakers = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const format = sawAndroid && sawIos ? 'mixed'
    : sawAndroid ? 'android'
    : sawIos ? 'ios'
    : 'unknown';

  return { roomTitle, speakers, messages: kept, skipped, format };
}

function push(messages, speaker, text, date, minutes) {
  messages.push({ speaker, text, date, minutes, media: false, _open: true });
}

function closeAll(messages) {
  if (messages.length > 0) messages[messages.length - 1]._open = false;
}

/**
 * Turn parsed messages into study candidates.
 *
 * Every one of my own text utterances becomes a card, in conversation order and
 * unedited — the deck is not curated by frequency or difficulty. Each card
 * carries the few preceding turns (the other party's included) so the
 * translation can resolve deictics like "그거" instead of guessing.
 *
 * @param {object} parsed result of parseKakaoExport
 * @param {string} me the speaker name to study
 * @param {{contextTurns?: number, minChars?: number}} [opts]
 */
export function buildCandidates(parsed, me, opts = {}) {
  const contextTurns = opts.contextTurns ?? 3;
  // 1, not 2: the deck is deliberately uncurated, so "넵" earns a card like
  // anything else. Only genuinely empty text is dropped.
  const minChars = opts.minChars ?? 1;
  const out = [];

  parsed.messages.forEach((m, idx) => {
    if (m.speaker !== me) return;
    if (m.media) return;
    const text = m.text.trim();
    if (text.length < minChars) return;

    const context = [];
    for (let j = Math.max(0, idx - contextTurns); j < idx; j++) {
      const c = parsed.messages[j];
      if (c.media) continue;
      context.push({ speaker: c.speaker, text: c.text.trim(), mine: c.speaker === me });
    }

    out.push({
      id: 'c' + idx,
      ko: text,
      context,
      date: m.date,
      minutes: m.minutes,
    });
  });

  return out;
}

/**
 * Group candidates into one deck per calendar day.
 *
 * A day is the unit of study: a single export can cover months, and translating
 * or drilling all of it at once is the thing that makes a deck feel impossible.
 * Splitting by day keeps every utterance (nothing is curated away) while making
 * a session finite — and it costs one small translation call instead of one huge
 * one. Days come back newest first, which is the order someone wants to study.
 *
 * @param {{id: string, ko: string, date: string|null}[]} candidates
 * @returns {{date: string, label: string, cards: object[]}[]}
 */
export function groupByDay(candidates) {
  const days = new Map();
  for (const c of candidates) {
    const key = c.date || '날짜 미상';
    if (!days.has(key)) days.set(key, []);
    days.get(key).push(c);
  }
  return [...days.entries()]
    .map(([date, cards]) => ({ date, label: date, cards, sort: dateSortKey(date) }))
    .sort((a, b) => b.sort - a.sort)
    .map(({ date, label, cards }) => ({ date, label, cards }));
}

/** Sortable number from "2024년 3월 11일"; unknown dates sink to the bottom. */
function dateSortKey(date) {
  const m = String(date).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!m) return -1;
  return +m[1] * 10000 + +m[2] * 100 + +m[3];
}

/** Rough label for the deck, used to steer register in the translation prompt. */
export function guessRoomType(parsed) {
  const honorific = /(팀장|과장|부장|대리|차장|이사|대표|님께|하십니다|하겠습니다|드립니다|부탁드리)/;
  let formal = 0;
  let total = 0;
  for (const m of parsed.messages) {
    if (m.media) continue;
    total++;
    if (honorific.test(m.text)) formal++;
  }
  if (total === 0) return 'casual';
  return formal / total > 0.12 ? 'business' : 'casual';
}
