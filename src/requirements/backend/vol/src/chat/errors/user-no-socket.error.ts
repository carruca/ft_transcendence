export class UserNoSocketError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UserNoSocketError";
  }
}
