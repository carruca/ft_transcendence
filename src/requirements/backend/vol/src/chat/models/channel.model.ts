import {
  UserModel as User,
  EventModel as Event,
} from '.';

import { EventManager } from '../managers';

import {
  ChannelData,
  ChannelTopic,
} from '../interfaces';

import {
  UserDTO,
  ChannelDTO,
  ChannelUserDTO,
  ChannelTopicDTO,
} from '../dto';

import {
  EventType,
  UserChannelRole,
} from '../enums';

import {
  PropertyUndefinedError,
  NotImplementedError,
  DuplicateValueError,
} from '../errors';

import { Channel as ChannelDB } from '../../channels/entities/channel.entity';

export { ChannelData, ChannelTopic, ChannelDTO };

export class ChannelModel {
  private users_ = new Map<string, User>;
  private bans_ = new Set<string>;
  private mutes_ = new Set<string>;
  private opers_ = new Set<string>;
  private eventManager_ = new EventManager;

  public constructor(
    private readonly uuid_: string,
    private name_: string,
    private readonly owner_: User,
    private readonly createdDate_: Date = new Date(),
    private topic_?: ChannelTopic,
    private password_?: string,
  ) {}

  public addMessageEvent(sourceUser: User, value: string): Event {
    return this.eventManager_.addEvent(Event.message(sourceUser, value));
  }

  public addEvent(event: Event): Event {
    return this.eventManager_.addEvent(event);
  }

  public addGenericEvent(eventType: EventType, sourceUser: User, targetUser?: User): Event {
    return this.eventManager_.addEvent(Event.generic(eventType, sourceUser, targetUser));
  }

  public addKickEvent(sourceUser: User, targetUser: User, value?: string): Event {
    return this.eventManager_.addEvent(Event.kick(sourceUser, targetUser, value));
  }

  public hasUser(user: User): boolean {
    return this.users_.has(user.uuid);
  }

  public addUser(user: User): boolean {
    // Lógica para agregar un usuario al canal
    if (!this.hasUser(user)) {
      this.users_.set(user.uuid, user);
      return true;
    }
    throw new DuplicateValueError("ChannelModel.addUser: User already exists in that channel");
    return false;
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
    return this.owner == user;
  }

  public getUsers(): User[] {
    return Array.from(this.users_.values());
  }

  public getUsersExcept(exceptUser: User): User[] {
    return this.getUsers().filter((user: User) => user.uuid !== exceptUser.uuid );
  }

  public getDTO(): ChannelDTO {
    return new ChannelDTO(this);
  }

  public getTopicDTO(): ChannelTopicDTO | undefined {
    if (!this.topic_)
      return undefined;
    return new ChannelTopicDTO(this.topic_);
  }

  public getUserDTO(user: User): ChannelUserDTO {
    return new ChannelUserDTO(this, user);
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

  get createdDate(): Date {
    return this.createdDate_;
  }

  get owner(): User {
    return this.owner_;
  }
/*
  set successor(user: User | undefined) {
    this.successor_ = user;
  }

  get successor(): User | undefined {
    return this.successor_;
  }
*/
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
}
