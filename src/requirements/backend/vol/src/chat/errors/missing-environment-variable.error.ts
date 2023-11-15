export class MissingEnvironmentVariableError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "MissingEnvironmentVariableError";
    }
}
