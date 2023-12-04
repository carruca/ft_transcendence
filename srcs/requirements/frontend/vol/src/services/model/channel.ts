import {
    User,
    ChannelUser,
    Event,
} from '.';

import type {
    ChannelPayload,
} from '../interface';

import {
    readonly,
    reactive,
} from 'vue';


export class Channel {
    private readonly maxEvents_: number = 20;

    public readonly id: string;
    public readonly name: string;
    public owner: User;
    public readonly createdDate: Date;
    public password: boolean;
	public topicUser: User;
	public topicSetDate: Date;
	public topic: string;
    public readonly users = reactive(new Map<string, ChannelUser>());
    public readonly events_ = reactive(new Map<string, Event>());

    constructor(channelPayload: ChannelPayload) {
      this.id = channelPayload.id;
      this.name = channelPayload.name;
      this.owner = channelPayload.owner;
      this.createdDate = channelPayload.createdDate;
      this.password = channelPayload.password ?? false;
	  if (channelPayload.users)
      	this.addUsers(channelPayload.users);
	  if (channelPayload.events)
        this.addEvents(channelPayload.events);
    }

    addUsers(channelUsers: ChannelUser[]) {
      if (channelUsers) {
        channelUsers.map((channelUser: ChannelUser) => {
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
      this.users.delete(user.id);
    }

    delUserById(userId: string) {
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

    update(channelUser: ChannelUser, changes: any) {
        if (changes.password !== undefined)
            this.password = changes.password;
        if (changes.topicUser !== undefined)
            this.topicUser = changes.topicUser;
        if (changes.topicSetDate !== undefined)
            this.topicSetDate = changes.topicSetDate;
        if (changes.topic !== undefined)
            this.topic = changes.topic;
        if (changes.admin !== undefined) {
            //console.log("aqui", channelUser.id, changes);
            channelUser.isAdmin = changes.admin;
            //console.log("isadmin", channelUser.isAdmin);
        }
        if (changes.muted !== undefined)
            channelUser.isMuted = changes.muted;
        if (changes.banned !== undefined)
            channelUser.isBanned = changes.banned;
    }

    get events(): Map<string, Event> {
      return readonly(this.events_);
    }
}
