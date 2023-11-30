export class ChannelSummary {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public membership: number,
        public password: boolean = false,
    ) {}
}
