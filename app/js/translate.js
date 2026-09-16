/**
 * Turning a day of Korean conversation into English, wherever the app runs.
 *
 * Two providers, picked automatically:
 *
 *   claude  — the page is a published Claude artifact, so `claude.use("sample")`
 *             asks the viewer's own Claude. No key, no setup.
 *   apikey  — the page is self-hosted (GitHub Pages, a static host), so the user
 *             supplies their own Anthropic key. Anthropic only accepts browser
 *             requests when they opt in with the
 *             `anthropic-dangerous-direct-browser-access` header; the key stays
 *             in this browser and is never sent anywhere but api.anthropic.com.
 *
 * With neither, translation is unavailable and the app falls back to the sample
 * deck, which ships with English already written.
 */

const KEY_STORE = 'rte.apikey';
const MODEL_STORE = 'rte.model';

export const MODELS = [
  { id: 'claude-opus-5', label: 'Opus 5 · 가장 정확' },
  { id: 'claude-sonnet-5', label: 'Sonnet 5 · 균형' },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5 · 가장 저렴' },
];

let sampleFn = null;

/** Resolve the artifact capability once; absence is normal, not an error. */
export async function detect() {
  try {
    sampleFn = (await window.claude?.use?.('sample')) || null;
  } catch {
    sampleFn = null;
  }
  return provider();
}

export function provider() {
  if (sampleFn) return 'claude';
  if (getKey()) return 'apikey';
  return 'none';
}

export const getKey = () => {
  try { return localStorage.getItem(KEY_STORE) || ''; } catch { return ''; }
};
export const setKey = (v) => {
  try { v ? localStorage.setItem(KEY_STORE, v) : localStorage.removeItem(KEY_STORE); } catch { /* private mode */ }
};
export const getModel = () => {
  try { return localStorage.getItem(MODEL_STORE) || MODELS[0].id; } catch { return MODELS[0].id; }
};
export const setModel = (v) => {
  try { localStorage.setItem(MODEL_STORE, v); } catch { /* private mode */ }
};

/**
 * Translate one slice of a day's conversation.
 *
 * Every line is translated, not only mine (D18). That is what produces an
 * English conversation with my turn in it, which is both what a card's context
 * shows and the only material a roleplay could later run on.
 *
 * `ref` lines are read but not translated: when a day is too long for one call,
 * each slice after the first carries the tail of the one before it so the model
 * is never dropped into the middle of a conversation with no idea what "그거"
 * refers to.
 *
 * @param {{id: string, speaker: string, ko: string, ref?: boolean}[]} slice
 * @param {'business'|'casual'} roomType
 * @returns {Promise<{id: string, en: string, situation: string}[]>}
 */
export async function translateDay(slice, roomType) {
  const prompt = buildPrompt(slice, roomType);
  const p = provider();
  if (p === 'claude') return viaSample(prompt);
  if (p === 'apikey') return viaApi(prompt);
  throw { code: 'no_provider', message: 'No translation provider configured' };
}

function buildPrompt(slice, roomType) {
  const items = slice.map((m) => {
    const row = { id: m.id, speaker: m.speaker, ko: m.ko };
    if (m.ref) row.ref = true;
    return row;
  });
  const register = roomType === 'business'
    ? '직장 동료·상사와 쓰는 정중하지만 딱딱하지 않은 영어'
    : '친구끼리 쓰는 편안한 구어체 영어';

  return '한국어 메신저 대화를 영어로 옮긴다. 대화 전체가 영어로 읽혀야 한다.\n\n' +
    '규칙:\n' +
    '- ref가 없는 줄은 **전부** 번역한다. 한 줄도 건너뛰지 마라.\n' +
    '- ref: true인 줄은 앞선 맥락이다. 읽기만 하고 결과에 넣지 마라.\n' +
    `- 말투: ${register}. 교과서 문장이 아니라 실제로 입에서 나오는 말로.\n` +
    '- 대화 전체를 읽고 옮긴다. "그거", "이거"는 영어에서도 that, this로 유지한다.\n' +
    '  뭘 가리키는지 억지로 밝히지 마라.\n' +
    '- "넵", "ㅇㅇ" 같은 짧은 반응도 영어에서 실제로 쓰는 대응 표현을 준다.\n' +
    '- 한 줄당 영어 한 문장. 후보를 나열하지 마라.\n' +
    '- situation: 그 줄의 기능을 한국어 2~6자로. 예) 마감 확인, 사과, 약속 잡기\n\n' +
    '오직 JSON 배열만 출력한다. ref가 아닌 줄과 개수가 같아야 한다:\n' +
    '[{"id":"m3","en":"Can you get that done by today?","situation":"마감 확인"}]\n\n' +
    JSON.stringify(items, null, 1);
}

async function viaSample(prompt) {
  const rows = await sampleFn.json(prompt, { modelTier: 'default' });
  return Array.isArray(rows) ? rows : [];
}

async function viaApi(prompt) {
  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': getKey(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: getModel(),
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  } catch {
    throw { code: 'upstream_error', message: 'network' };
  }

  if (!res.ok) {
    const code = res.status === 401 ? 'not_granted'
      : res.status === 429 ? 'rate_limited'
      : res.status === 400 ? 'invalid_request'
      : 'upstream_error';
    throw { code, message: `HTTP ${res.status}` };
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
  return parseRows(text);
}

/** The model is asked for a bare array, but tolerate a fence or stray prose. */
function parseRows(text) {
  const tryParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
  let v = tryParse(text);
  if (!v) {
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) v = tryParse(fence[1]);
  }
  if (!v) {
    const a = text.indexOf('[');
    const b = text.lastIndexOf(']');
    if (a >= 0 && b > a) v = tryParse(text.slice(a, b + 1));
  }
  if (!Array.isArray(v)) throw { code: 'invalid_json', message: 'no JSON array in reply', text };
  return v;
}

/** Viewer-facing copy for a failure code. */
export function messageFor(code) {
  switch (code) {
    case 'no_provider': return 'API 키를 넣거나, Claude 아티팩트로 열어야 번역할 수 있습니다.';
    case 'not_granted': return 'API 키가 거부됐습니다. 설정에서 다시 확인해 주세요.';
    case 'rate_limited': return '요청이 한도를 넘었습니다. 잠시 뒤 다시 시도해 주세요.';
    case 'session_expired': return 'claude.ai에 다시 로그인한 뒤 시도해 주세요.';
    case 'prompt_too_large': return '이 날 대화가 너무 깁니다.';
    case 'invalid_json': return '응답 형식이 어긋났습니다. 다시 시도해 주세요.';
    case 'invalid_request': return '요청이 거부됐습니다. 모델 이름과 키를 확인해 주세요.';
    case 'refused': return 'Claude가 이 내용의 번역을 거절했습니다.';
    default: return '연결이 끊겼습니다.';
  }
}
