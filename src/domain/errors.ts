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
