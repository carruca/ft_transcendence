export class PropertyUndefinedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PropertyUndefinedError";
  }
}
