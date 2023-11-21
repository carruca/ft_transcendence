import {
    User,
    ChannelUserProperties,
} from './';

import {
    UserSiteRoleEnum,
} from '../enum';

export class ChannelUser {
    constructor(
        public readonly user: User,
        private readonly props_: ChannelUserProperties,
    ) {}

    get uuid(): string {
        return this.user.uuid;
    }

    get name(): string {
        return this.user.name;
    }

    get siteRole(): UserSiteRoleEnum {
        return this.user.siteRole;
    }

    get isFriend(): boolean {
        return this.user.isFriend;
    }

    set isAdmin(value: boolean): void {
        this.props_.isAdmin = value;
    }

    get isAdmin(): boolean {
        return this.props_.isAdmin;
    }

    set isBanned(value: boolean): void {
        this.props_.isBanned = value;
    }

    get isBanned(): boolean {
        return this.props_.isBanned;
    }

    set isMuted(value: boolean): void {
        this.props_.isMuted = value;
    }

    get isMuted(): boolean {
        return this.props_.isMuted;
    }
}

