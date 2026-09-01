export class NotExistError extends Error {
  constructor(public message: string) {
    super(message);
  }
}
