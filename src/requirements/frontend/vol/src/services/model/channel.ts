import {
    User,
    ChannelUser,
    ChannelTopic,
    Event,
} from '.';

import {
    ChannelDTO,
} from '../dto';

import {
    readonly,
    reactive,
} from 'vue';


export class Channel {
    private readonly maxEvents_: number = 4;

    public readonly uuid: string;
    public readonly name: string;
    public readonly ownerUser: User;
    public readonly creationDate: Date;
    public hasPassword: boolean;
    public readonly users = reactive(new Map<string, ChannelUser>());
    private readonly events_ = new Map<string, Event>();

    constructor(channelPayload: ChannelPayload) {
      this.uuid = channelPayload.uuid;
      this.name = channelPayload.name;
      this.ownerUser = channelPayload.ownerUser;
      this.creationDate = channelPayload.creationDate;
      this.hasPassword = channelPayload.hasPassword ?? false;
      this.addUsers(channelPayload.users);
      this.addEvents(channelPayload.events);
    }

    addUsers(channelUsers: ChannelUser[]) {
      if (channelUsers)
        channelUsers.map((channelUser: User) => {
            this.users.set(channelUser.uuid, channelUser);
            channelUser.user.addChannel(this);
        });
    }

    addEvents(events: Event[]) {
      if (events)
        events.map((event: Event) => this.events_.set(event.uuid, event));
    }

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
