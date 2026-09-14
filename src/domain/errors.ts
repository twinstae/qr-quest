import type { LiveViolation } from "./case.ts";

export class NotExistError extends Error {
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
