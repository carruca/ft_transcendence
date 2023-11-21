import {
    User,
    ChannelUser,
} from '.';

import {
    Event,
} from '../event';

import {
    readonly,
    reactive,
} from 'vue';


export class Channel {
    private readonly maxEvents_: number = 4;

    constructor(
        public readonly uuid: string,
        public readonly name: string,
        public readonly owner: User,
        public readonly creationDate = new Date(),
        public hasPassword: boolean = false,
        public readonly users = reactive(new Map<string, ChannelUser>()),
        private readonly events_ = new Map<string, Event>(),
    ) {}

    clear() {
        this.users.clear();
        this.events_.clear();
    }

    addUser(channelUser: ChannelUser) {
        this.users.set(channelUser.uuid, channelUser);
    }

    delUser(user: User) {
        this.users.delete(channelUser.uuid);
    }

    delUserByUUID(userUUID: string) {
        this.users.delete(userUUID);
    }

    user(user: User): ChannelUser {
        return this.users.get(user.uuid);
    }

    addEvent(event: Event) {
        if (this.events_.size >= this.maxEvents_) {
            this.events_.delete(this.events_.keys().next().value);
        }
        this.events_.set(event.uuid, event);
    }

    get events(): Map<string, Event> {
        return readonly(this.events_);
    }
}
