// 참가자에게 보여주거나 인쇄물에 들어가는 코드들. 0/O, 1/I/L처럼 눈으로 헷갈리는
// 글자는 빼서, 종이에 인쇄된 QR과 직원이 확인하는 인증번호를 사람이 잘못 읽지 않게 한다.
const SAFE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export const QR_TOKEN_LENGTH = 10;
export const COMPLETION_CODE_PREFIX = "79-1";
export const COMPLETION_CODE_LENGTH = 4;

/** 테스트에서 결정적인 값을 만들 수 있도록 난수원을 주입받는다. */
export type RandomSource = () => number;

function pickFrom(alphabet: string, length: number, random: RandomSource): string {
  let value = "";
  for (let index = 0; index < length; index++) {
    const position = Math.min(alphabet.length - 1, Math.floor(random() * alphabet.length));
    value += alphabet[position] ?? "";
  }
  return value;
}

/**
 * 시작 QR과 단계 QR의 URL에 쓰이는 토큰.
 * 이 값이 QR에 인쇄되므로, 내용을 고쳐도 토큰은 그대로 둔다(요구 23).
 */
export function generateQrToken(random: RandomSource = Math.random): string {
  return pickFrom(SAFE_ALPHABET, QR_TOKEN_LENGTH, random);
}

export function isQrToken(value: string): boolean {
  return value.length === QR_TOKEN_LENGTH && /^[23456789A-HJ-NP-Z]+$/.test(value);
}

/** 완주 인증번호 `79-1-XXXX`. 직원이 화면에서 읽고 리딤 화면에 입력한다. */
export function generateCompletionCode(random: RandomSource = Math.random): string {
  return `${COMPLETION_CODE_PREFIX}-${pickFrom(SAFE_ALPHABET, COMPLETION_CODE_LENGTH, random)}`;
}

/** 하이픈을 뺀 접두사. `79-1` → `791`. */
const COMPLETION_CODE_PREFIX_DIGITS = COMPLETION_CODE_PREFIX.replace("-", "");

/**
 * 직원이 소문자로 입력하거나 공백/하이픈을 빠뜨리거나 다른 자리에 넣어도
 * 같은 코드로 보게 한다. 먼저 글자만 남기고, 접두사를 확인해 다시 붙인다.
 */
export function normalizeCompletionCode(code: string): string {
  const compact = code.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (!compact.startsWith(COMPLETION_CODE_PREFIX_DIGITS)) return compact;
  return `${COMPLETION_CODE_PREFIX}-${compact.slice(COMPLETION_CODE_PREFIX_DIGITS.length)}`;
}

export function isValidCompletionCode(code: string): boolean {
  const normalized = normalizeCompletionCode(code);
  return (
    normalized.length === COMPLETION_CODE_PREFIX.length + 1 + COMPLETION_CODE_LENGTH &&
    normalized.startsWith(`${COMPLETION_CODE_PREFIX}-`) &&
    /^[23456789A-HJ-NP-Z]+$/.test(normalized.slice(COMPLETION_CODE_PREFIX.length + 1))
  );
}
