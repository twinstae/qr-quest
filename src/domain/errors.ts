import type { LiveViolation } from "./case.ts";

export class NotExistError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

/** 요청 자체가 규칙에 맞지 않는다(400). 메시지는 화면에 그대로 보여줄 수 있게 쓴다. */
export class InvalidRequestError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export class FileTooLargeError extends Error {
  constructor(
    public message: string,
    public limitBytes: number,
    public actualBytes: number,
  ) {
    super(message);
  }
}

export class UnsupportedFileTypeError extends Error {
  constructor(
    public message: string,
    public allowedTypes: readonly string[],
  ) {
    super(message);
  }
}

export class LiveReadinessError extends Error {
  constructor(
    public message: string,
    public violations: readonly LiveViolation[],
  ) {
    super(message);
  }
}
