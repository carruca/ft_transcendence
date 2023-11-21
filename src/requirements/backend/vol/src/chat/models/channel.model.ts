import {
  UserModel as User,
  ChannelTopicModel as ChannelTopic,
  EventModel as Event,
} from '.';

import {
  EventManager,
} from '../managers';

import {
  ChannelPayload,
  ChannelTopicPayload,
} from '../interfaces';

import {
  ChannelDTO,
} from '../dto';

import {
  EventTypeEnum,
  UserChannelRoleEnum,
} from '../enums';

import {
  PropertyUndefinedError,
  NotImplementedError,
  DuplicateValueError,
} from '../errors';

import { Channel as ChannelDB } from '../../channels/entities/channel.entity';

export class ChannelModel {
  private readonly uuid_: string;
  private name_: string;
  private readonly ownerUser_: User;
  private readonly creationDate_;
  private topic_?: ChannelTopic;
  private password_?: string;

  private users_ = new Map<string, User>;
  private bans_ = new Set<string>;
  private mutes_ = new Set<string>;
  private opers_ = new Set<string>;
  private eventManager_ = new EventManager;

  public constructor(channelPayload: ChannelPayload) {
    this.uuid_ = channelPayload.uuid;
    this.name_ = channelPayload.name;
    this.ownerUser_ = channelPayload.ownerUser;
    this.creationDate_ = channelPayload.creationDate ?? new Date();
    this.topic_ = channelPayload.topic ? new ChannelTopic(channelPayload.topic) : undefined;
    this.password_ = channelPayload.password;
  }

  public addMessageEvent(sourceUser: User, value: string): Event {
    return this.eventManager_.addEvent(Event.message(sourceUser, value));
  }

  public addEvent(event: Event): Event {
    return this.eventManager_.addEvent(event);
  }

  public addGenericEvent(type: EventTypeEnum, sourceUser: User, targetUser?: User): Event {
    return this.eventManager_.addEvent(Event.generic(type, sourceUser, targetUser));
  }

  public addKickEvent(sourceUser: User, targetUser: User, value?: string): Event {
    return this.eventManager_.addEvent(Event.kick(sourceUser, targetUser, value));
  }

  public hasUser(user: User): boolean {
    return this.users_.has(user.uuid);
  }

  public addUser(user: User): boolean {
    // Lógica para agregar un usuario al canal
    if (this.hasUser(user)) {
      throw new DuplicateValueError("ChannelModel.addUser: User already exists in that channel");
      return false;
    }
    this.users_.set(user.uuid, user);
    return true;
  }

  public removeUser(user: User) {
    // Lógica para eliminar un usuario del canal
    this.users_.delete(user.uuid);
    this.opers_.delete(user.uuid);
  }

  public addBan(user: User): boolean {
    if (!this.hasBanned(user)) {
      this.bans_.add(user.uuid);
      return true;
    }
    return false;
  }

  public hasBanned(user: User): boolean {
    return this.bans_.has(user.uuid);
  }

  public removeBan(user: User): void {
    this.bans_.delete(user.uuid);
  }

  public addMute(user: User): boolean {
    if (!this.hasMuted(user)) {
      this.mutes_.add(user.uuid);
      return true;
    }
    return false;
  }

  public hasMuted(user: User): boolean {
    return this.mutes_.has(user.uuid);
  }

  public removeMute(user: User): void {
    this.mutes_.delete(user.uuid);
  }

  public addOper(user: User): boolean {
    if (!this.hasOper(user)) {
      this.opers_.add(user.uuid);
      return true;
    }
    return false;
  }

  public hasOper(user: User): boolean {
    return this.opers_.has(user.uuid);
  }

  public removeOper(user: User): void {
    this.opers_.delete(user.uuid);
  }

  public hasPrivileges(user: User): boolean {
    return this.isOwner(user) || this.hasOper(user);
  }

  public isOwner(user: User): boolean {
    return this.ownerUser == user;
  }

  public getUsers(): User[] {
    return Array.from(this.users_.values());
  }

  public getUsersExcept(exceptUser: User): User[] {
    return this.getUsers().filter((user: User) => user.uuid !== exceptUser.uuid );
  }

  //properties
  get isEmpty(): boolean {
    return this.users_.size === 0;
  }

  getUsersCount(): number {
    return this.users_.size;
  }

  get uuid(): string {
    return this.uuid_;
  }

  get name(): string {
    return this.name_;
  }

  get creationDate(): Date {
    return this.creationDate_;
  }

  get ownerUser(): User {
    return this.ownerUser_;
  }

  set topic(value: ChannelTopic | undefined) {
    this.topic_ = value;
  }

  get topic(): ChannelTopic | undefined {
    return this.topic_;
  }

  set password(value: string | undefined) {
    this.password_ = value;
  }

  get password(): string | undefined {
    return this.password_;
  }
  
  get DTO(): ChannelDTO {
    return new ChannelDTO(this);
  }
}
