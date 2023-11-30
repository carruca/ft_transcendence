export class ChannelUserProperties {
    constructor(
        public isOwner: boolean = false,
        public isAdmin: boolean = false,
        public isMuted: boolean = false,
        public isBanned: boolean = false,
    )
}
