# Real Talk English — 말한 대로 영어

카카오톡 대화를 **날짜별로 나눠 하루치씩**, 내가 실제로 쓴 문장으로 영어 말하기를
연습하는 PWA. 교재 문장이 아니라 어제 회사 단체방에 내가 친 그 말이 카드가 된다.
아는 문장은 **오른쪽으로**, 막힌 문장은 **왼쪽으로** 넘긴다.

> ⚠️ 이 프로젝트는 `hyrox-app` 레포에 임시로 들어 있다. 원래 목적지는
> `ksj11167/real-talk-english`이며, 레포 생성 권한이 없어 옮기지 못했다.
> 아래 **레포 이전** 참조.

## 어떻게 동작하나

```
카톡 대화 내보내기(.txt)
        ↓  기기 안에서 파싱
   미리보기 + 승인 게이트
        ↓  날짜별로 분할
  9월 11일 · 7장   9월 13일 · 3장   …
        ↓  하루치만 번역 (앞뒤 맥락 포함)
  스와이프 덱 → 마이크 → 채점 → FSRS 간격반복
```

**하루가 학습 단위**다. 6개월치를 한 번에 처리하면 카드가 3,000장이 되어 아무도
끝내지 못하지만, 하루로 끊으면 5~30장이라 한 번에 끝난다. 그러면서도 하루 안에서는
`넵` 하나까지 전부 남는다 — 걸러내는 게 아니라 범위를 좁히는 것이라 "내가 한 말
그대로"라는 원칙을 깨지 않는다.

## 벤치마킹

| 출처 | 가져온 것 |
|---|---|
| 데이팅 앱 | 스와이프 채점 — 오른쪽 "외웠다", 왼쪽 "다시". 손가락 한 번이 버튼 찾기보다 빠르고, 드래그 중에 판정이 미리 보인다 |
| 듀오링고 | 두툼한 눌리는 버튼(아래 그림자), 굵은 진행 바, 큰 터치 타깃 |
| 스픽 | 말하기 중심 — 큰 마이크, 한 화면에 한 문장 |
| Anki | FSRS 스케줄러 (직접 구현하지 않고 `ts-fsrs` 사용) |

## 쓰는 오픈소스

| | 용도 | 라이선스 |
|---|---|---|
| [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs) 5.4.2 | 간격반복 스케줄링. `app/vendor/`에 벤더링 | MIT |
| IBM Plex Sans KR / Mono, Newsreader | 타이포그래피 (Google Fonts) | OFL |

스와이프 제스처와 서비스워커는 직접 썼다. 각각 100줄 남짓이라 의존성을 더할
이유가 없었다.

## 구성

```
app/                        배포 대상 (빌드 불필요, 정적 파일)
  index.html                화면 구조
  styles.css                토큰 · 스와이프 덱 · 라이트/다크
  manifest.webmanifest      설치형 PWA
  sw.js                     오프라인 셸
  js/
    main.js                 화면 전환과 세션 흐름
    kakao-parser.js         카톡 포맷 파싱 + 날짜 분할
    swipe.js                카드 스택 스와이프 (포인터 · 키보드)
    srs.js                  FSRS 래퍼
    translate.js            번역 제공자 (Claude 아티팩트 | 본인 API 키)
  vendor/ts-fsrs.mjs
tools/make-artifact.mjs     app/index.html → Claude 아티팩트용 파일
docs/decisions.md           확정된 결정 · 가정 · 인터뷰 기록
```

## 테스트

```bash
node app/js/kakao-parser.test.mjs      # 23개
```

파서는 앱의 심장이고 카톡 포맷은 안정적인 계약이 아니다(Android 대괄호 형식과 iOS
날짜-쉼표 형식이 다르고, 여러 줄 메시지·미디어 자리표시자·시스템 공지가 섞인다).
테스트가 회귀 방어선이다.

## 실행

```bash
npx http-server app -p 8787
```

## 배포

두 곳에 나가고, 같은 코드를 쓴다.

**GitHub Pages** — `main`에 `app/**`가 바뀌면 자동 배포된다
(`.github/workflows/pages.yml`). 레포 Settings → Pages → Source를
**GitHub Actions**로 한 번 바꿔주면 된다. 여기서는 설치형 PWA로 동작하고,
번역은 설정 화면에 본인 Anthropic API 키를 넣어야 한다.

**Claude 아티팩트** — `claude.use("sample")`로 뷰어의 Claude에 직접 번역을
요청하므로 키가 필요 없다. 아티팩트 플랫폼이 자체 `<head>`를 씌우기 때문에
문서 껍데기를 벗겨서 올린다:

```bash
node tools/make-artifact.mjs /tmp/artifact.html
```

## 알려진 제약

- **iOS 웹앱은 카톡 공유시트로 파일을 못 받는다** (Web Share Target 미지원).
  파일 앱에 저장한 뒤 앱에서 고르는 한 단계가 더 필요하다. Android는 직접 된다.
- **카드는 브라우저별로 저장된다** (localStorage). 기기 간 동기화 없음.
- **음성 인식은 브라우저 의존**이다. 미지원 시 정답 보기로 자동 전환된다.
  Chrome은 오디오를 구글 서버로 보낸다.
- **API 키를 브라우저에 두는 방식**은 공용 기기에서 쓰면 안 된다. Anthropic이
  `anthropic-dangerous-direct-browser-access` 헤더로 허용하는 "본인 키" 패턴이다.
- 카카오는 대화를 읽는 공식 API를 제공하지 않는다. 내보내기 파일이 유일한 경로다.

## 레포 이전

`ksj11167/real-talk-english`를 만든 뒤:

```bash
git remote add rte https://github.com/ksj11167/real-talk-english.git
git push rte claude/messenger-english-conversation-app-ombn7i:main
```
