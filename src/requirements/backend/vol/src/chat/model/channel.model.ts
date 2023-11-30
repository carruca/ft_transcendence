import {
  User,
  Event,
} from '.';

import {
  RollingLogger,
} from '../util';

import {
  EventPayload,
  ChannelPayload,
} from '../interface';

import {
  ChannelDTO,
  ChannelUserDTO,
  ChannelSummaryDTO,
} from '../dto';

import {
  NotifyEventTypeEnum,
  EventTypeEnum,
  UserStatusEnum,
} from '../enum';

import {
  PropertyUndefinedError,
  NotImplementedError,
  DuplicateValueError,
} from '../error';

import {
  Channel as ChannelDB,
} from '../../channels/entities/channel.entity';

import {
  ChannelUser as ChannelUserDB,
} from '../../channels/entities/channel-user.entity';

const EVENTS_MAX = 100;

export class Channel {
  private readonly id_: string;
  private readonly name_: string;
  private owner_: User;
  private readonly createdDate_;
  private topic_?: string;
  private topicSetDate_?: Date;
  private topicUser_?: User;
  private password_?: boolean;

  private readonly users_ = new Set<User>;
  private readonly admins_ = new Set<User>;
  private readonly bans_ = new Set<User>;
  private readonly mutes_ = new Set<User>;
  private readonly events_ = new RollingLogger<Event>(EVENTS_MAX);

  private readonly notifyCallback_: Function;

  public constructor(notifyCallback: Function, channelPayload: ChannelPayload) {
    if (!channelPayload.id)
      throw new PropertyUndefinedError("userPayload.id not defined");
    this.id_ = channelPayload.id;
    if (!channelPayload.name)
      throw new PropertyUndefinedError("userPayload.name not defined");
    this.name_ = channelPayload.name;
    if (!channelPayload.owner)
      throw new PropertyUndefinedError("userPayload.owner not defined");
    this.owner_ = channelPayload.owner;
    this.createdDate_ = channelPayload.createdDate ?? new Date();
    this.topic_ = channelPayload.topic;
    this.topicSetDate_ = channelPayload.topicSetDate;
    this.topicUser_ = channelPayload.topicUser;
    this.password_ = channelPayload.password;
    this.notifyCallback_ = notifyCallback;
  }

  public delete(): void {
    this.notify_(NotifyEventTypeEnum.DELETE);

    for (const user of this.users_.values()) {
      user.removeChannel(this);
    }
  }

  private notify_(type: NotifyEventTypeEnum, changes?: {}) {
    this.notifyCallback_([ this ], type, changes);
  }

  private childNotify_(object: any[], type: NotifyEventTypeEnum, changes?: {}) {
    this.notifyCallback_( [...object, this ], type, changes);
  }

  public createEvent(eventPayload: EventPayload): Event {
    const event = new Event(this.childNotify_.bind(this), eventPayload);

    this.events_.add(event);
    this.childNotify_([ event ], NotifyEventTypeEnum.CREATE);
    return event;
  }

  public createEventAction(type: EventTypeEnum, sourceUser: User, targetUser: User, value?: string): Event {
    return this.createEvent({
      type: type,
      sourceUser: sourceUser,
      targetUser: targetUser,
      value: value,
    });
  }

  public createEventGeneric(type: EventTypeEnum, sourceUser: User, value?: string): Event {
    console.log("createEventGeneric:", type);
    return this.createEvent({
      type: type,
      sourceUser: sourceUser,
      value: value,
    });
  }

  public hasUser(user: User): boolean {
    return this.users_.has(user);
  }

  public addUser(user: User) {
    this.users_.add(user);
  }

  public removeUser(user: User) {
    this.users_.delete(user);
  }

  public setOptions(user: User, channelUserDB: ChannelUserDB) {
    if (channelUserDB.admin)
      this.admins_.add(user);
    else
      this.admins_.delete(user);
    
    if (channelUserDB.banned)
      this.bans_.add(user);
    else
      this.bans_.delete(user);

    if (channelUserDB.muted)
      this.mutes_.add(user);
    else
      this.mutes_.delete(user);
  }

  public hasPrivileges(user: User): boolean {
    return this.isOwner(user) || this.isAdmin(user);
  }

  public isOwner(user: User): boolean {
    return this.owner == user;
  }

  public getUsers(): User[] {
    return Array.from(this.users_.values());
  }

  public getUsersOnline(): User[] {
    return Array.from(this.users_.values()).filter((user) => user.status !== UserStatusEnum.OFFLINE); 
  }

  public getUsersExcept(exceptUser: User): User[] {
    return this.getUsers().filter((user: User) => user.id !== exceptUser.id );
  }

  public getEvents(): Event[] {
    console.log("channel::getEvents -> ", this.events_.values());
    return this.events_.values();
  }

  //properties
  get isEmpty(): boolean {
    return this.users_.size === 0;
  }

  getUsersCount(): number {
    return this.users_.size;
  }

  get id(): string {
    return this.id_;
  }

  get name(): string {
    return this.name_;
  }

  get createdDate(): Date {
    return this.createdDate_;
  }

  get owner(): User {
    return this.owner_;
  }

  isBanned(user: User): boolean {
    return this.bans_.has(user);
  }

  isMuted(user: User): boolean {
    return this.mutes_.has(user);
  }

  isAdmin(user: User): boolean {
    return this.admins_.has(user);
  }

  banUser(user: User) {
    if (!this.isBanned(user)) {
      this.bans_.add(user); 
      this.notify_(NotifyEventTypeEnum.UPDATE, {
        userId: user.id,
        banned: true,
      });
    }
  }

  unbanUser(user: User) {
    if (this.isBanned(user)) {
      this.bans_.delete(user);
      this.notify_(NotifyEventTypeEnum.UPDATE, {
        userId: user.id,
        banned: false,
      });
    }
  }

  muteUser(user: User) {
    if (!this.isMuted(user)) {
      this.mutes_.add(user);
      this.notify_(NotifyEventTypeEnum.UPDATE, {
        userId: user.id,
        muted: true,
      });
    }
  }

  unmuteUser(user: User) {
    if (this.isMuted(user)) {
      this.mutes_.delete(user);
      this.notify_(NotifyEventTypeEnum.UPDATE, { 
        userId: user.id,
        muted: false,
      });
    }
  }

  promoteUser(user: User) {
    if (!this.isAdmin(user)) {
      this.admins_.add(user); 
      this.notify_(NotifyEventTypeEnum.UPDATE, {
        userId: user.id,
        admin: true });
    }
  }

  demoteUser(user: User) {
    if (this.isAdmin(user)) {
      this.admins_.delete(user);
      this.notify_(NotifyEventTypeEnum.UPDATE, {
        userId: user.id,
        admin: false,
      });
    }
  }

  set owner(value: User) {
    if (this.owner_ !== value) {
      this.owner_ = value;
      this.notify_(NotifyEventTypeEnum.UPDATE, {
        owner: value,
      });
    }
  }

  set topic(value: string | undefined) {
    if (this.topic_ !== value) {
      this.topic_ = value;
      this.notify_(NotifyEventTypeEnum.UPDATE, {
        topic: value,
      });
    }
  }

  get topic(): string | undefined {
    return this.topic_;
  }

  set topicSetDate(value: Date | undefined) {
    if (this.topicSetDate_ !== value) {
      this.topicSetDate_ = value;
      this.notify_(NotifyEventTypeEnum.UPDATE, {
        topicSetDate: value,
      });
    }
  }

  get topicSetDate(): Date | undefined {
    return this.topicSetDate_;
  }

  set topicUser(value: User) {
    if (this.topicUser_ !== value) {
      this.topicUser_ = value;
      this.notify_(NotifyEventTypeEnum.UPDATE, {
        topicUser: value,
      });
    }
  }

  set password(value: boolean | undefined) {
    if (this.password_ !== value) {
      this.password_ = value;
      this.notify_(NotifyEventTypeEnum.UPDATE, {
        password: this.password != undefined,
      });
    }
  }

  get password(): boolean | undefined {
    return this.password_;
  }

  channelUserDTO(user: User): ChannelUserDTO {
    return new ChannelUserDTO(this, user);
  }

  get DTO(): ChannelDTO {
    return new ChannelDTO(this);
  }

  get summaryDTO(): ChannelSummaryDTO {
    return new ChannelSummaryDTO(this);
  }
}
