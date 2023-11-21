export class ChannelUser {
    private user_: User;
    public channelRole: UserChannelRoleEnum;
    public isMuted: boolean;
    public isBanned: boolea;

    constructor(channel: Channel, user: User) {
        this.user_ = user;
        this.isMuted = 
    }

    get uuid(): string {
        return this.user.uuid;
    }

    get name(): string {
        return this.user.name;
    }

    get siteRole(): string {
        return this.user.siteRole;
    }
}

export class Channel {
    public readonly uuid: string;
    public name: string;
    public createDate: Date;
    public readonly owner: User;
    public hasPassword: boolean;
    public topic: ChannelTopic;
    public users: User[];
    public events: Event[];
}
