import { EvenTypeEnum } from './event-type.enum';
import { ref, readonly } from 'vue';

export enum UserSiteRoleEnum {
    NONE,
    OWNER,
    MODERATOR,
}

export class User {
    constructor(
        public readonly uuid: string,
        public name: string,
        public siteRole: UserSiteRoleEnum = UserSiteRoleEnum.NONE,
        public isFriend: boolean = false,
    ) {}
}

export class ChannelUserProperties {
    constructor(
        public isAdmin: boolean = false,
        public isMuted: boolean = false,
        public isBanned: boolean = false,
    )
}

export class ChannelUser {
    constructor(
        private readonly user_: User,
        private readonly props_: ChannelUserProperties,
    ) {}

    get uuid(): string {
        return this.user_.uuid;
    }

    get name(): string {
        return this.user_.name;
    }

    get siteRole(): UserSiteRole {
        return this.user_.siteRole;
    }

    get isFriend(): boolean {
        return this.user_.isFriend;
    }

    get isAdmin(): boolean {
        return this.props_.isAdmin;
    }

    get isBanned(): boolean {
        return this.props_.isBanned;
    }

    get isMuted(): boolean {
        return this.props_.isMuted;
    }
}

export class Event {
    constructor (
        public readonly uuid: string,
        public readonly type: EventTypeEnum,
        public readonly sourceUser: User,
        public readonly targetUser?: User,
        public value: string = '',
        public readonly timestamp = new Date(),
        public edited: boolean = false,
    ) {
        console.log("AAAAAA");
        this.timestamp = this.timestamp ?? new Date();
    }
}

export class Channel {
    private readonly maxEvents_: number = 4;

    constructor(
        public readonly uuid: string,
        public readonly name: string,
        public readonly owner: User,
        public readonly creationDate = new Date(),
        public readonly users = new Map<string, ChannelUser>(),
        private readonly events_ = ref< Map<string, Event> >(new Map()),
    ) {}

    clear() {
        this.users.clear();
        this.events_.clear();
    }

    addEvent(event: Event) {
        if (this.events_.value.size >= this.maxEvents_) {
            this.events_.value.delete(this.events_.value.keys().next().value);
        }
        this.events_.value.set(event.uuid, event);
    }

    get events(): ref< Map<string, Event> > {
        return readonly(this.events_);
    }
}
