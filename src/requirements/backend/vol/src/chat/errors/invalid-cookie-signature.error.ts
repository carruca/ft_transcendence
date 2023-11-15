export class InvalidCookieSignatureError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "InvalidCookieSignatureError";
    }
}
