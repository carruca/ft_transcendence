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
    private readonly maxEvents_: number = 20;

    public readonly id: string;
    public readonly name: string;
    public readonly owner: User;
    public readonly createdDate: Date;
    public password: boolean;
    public readonly users = reactive(new Map<string, ChannelUser>());
    public readonly events_ = reactive(new Map<string, Event>());

    constructor(channelPayload: ChannelPayload) {
      this.id = channelPayload.id;
      this.name = channelPayload.name;
      this.owner = channelPayload.owner;
      this.createdDate = channelPayload.createdDate;
      this.password = channelPayload.password ?? false;
      this.addUsers(channelPayload.users);
      this.addEvents(channelPayload.events);
    }

    addUsers(channelUsers: ChannelUser[]) {
      if (channelUsers) {
        channelUsers.map((channelUser: User) => {
          this.users.set(channelUser.id, channelUser);
          channelUser.user.addChannel(this);
        });
      }
    }

    addEvents(events: Event[]) {
      if (events)
        events.map((event: Event) => this.events_.set(event.id, event));
    }

    clear() { 
      for (const channelUser of this.users.values()) {
          channelUser.user.delChannel(this);
      }
      this.users.clear();
      this.events_.clear();
    }

    addUser(channelUser: ChannelUser) {
      this.users.set(channelUser.id, channelUser);
    }

    delUser(user: User) {
      this.users.delete(channelUser.id);
    }

    delUserByUUID(userId: string) {
      this.users.delete(userId);
    }

    user(user: User): ChannelUser {
      return this.users.get(user.id);
    }

    addEvent(event: Event) {
      if (this.events_.size >= this.maxEvents_) {
        this.events_.delete(this.events_.keys().next().value);
      }
      this.events_.set(event.id, event);
    }

    get events(): Map<string, Event> {
      return readonly(this.events_);
    }
}
