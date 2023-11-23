export class ChannelSummary {
    constructor(
        public readonly uuid: string,
        public readonly name: string,
        public membership: number,
        public hasPassword: boolean = false,
    ) {}
}
