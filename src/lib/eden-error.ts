function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Eden Treaty는 실패를 `{ status, value: <서버 응답 바디> }`로 감싸서 준다. */
export function unwrapEdenError(error: unknown): unknown {
  if (isRecord(error) && isRecord(error.value)) return error.value;
  return error;
}
