import {
    User,
} from './';

import {
    UserStatusEnum,
    UserSiteRoleEnum,
} from '../enum';

import {
    ChannelUserPayload,
} from '../interface';

export class ChannelUser {
    public readonly user: User;
    public isAdmin: boolean;
    public isOwner: boolean;
    public isBanned: boolean;
    public isMuted: boolean;
    
    constructor(channelUserPayload: ChannelUserPayload) {
        this.user = channelUserPayload.user;
        this.isAdmin = channelUserPayload.admin;
        this.isOwner = channelUserPayload.owner;
        this.isBanned = channelUserPayload.banned;
        this.isMuted = channelUserPayload.muted;
    }

    get uuid(): string {
        return this.user.uuid;
    }

    get name(): string {
        return this.user.name;
    }

    get siteRole(): UserSiteRoleEnum {
        return this.user.siteRole;
    }

    get status(): UserStatusEnum {
        return this.user.status;
    }

    get isFriend(): boolean {
        return this.user.friend;
    }

    get isBlocked(): boolean {
        return this.user.blocked;
    }
}

