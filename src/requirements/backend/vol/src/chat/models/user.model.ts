import {
  ChannelModel as Channel,
  ConversationModel as Conversation,
} from '.';

import {
  UserPayload,
} from '../interfaces';

import {
  UserDTO,
} from '../dto';

import {
  UserStatusEnum,
  UserChannelRoleEnum,
  UserSiteRoleEnum,
} from '../enums';

import {
  PropertyUndefinedError,
} from '../errors';

import { 
  User as UserDB,
} from '../../users/entities/user.entity';

import {
  Socket,
} from 'socket.io';

export class UserModel {
  private readonly intraId_: number;
  private readonly uuid_: string;
  private name_: string;
  private status_: UserStatusEnum;
  private socket_?: Socket;
  private siteRole_: UserSiteRoleEnum;
  private banned_: boolean;
  private disabled_: boolean;

  private channels_ = new Set<Channel>; // Array para almacenar los canales a los que pertenece el nick
  private conversations_ = new Set<Conversation>;
  private blockUsers_ = new Set<UserModel>;
  //private watchers_ = new Set<User>;

  constructor(userPayload: UserPayload) {
    this.intraId_ = userPayload.intraId;
    this.uuid_ = userPayload.uuid;
    this.name_ = userPayload.name;
    this.socket_ = userPayload.socket;
    this.status_ = userPayload.status ?? UserStatusEnum.OFFLINE;
    this.siteRole_ = userPayload.siteRole ?? UserSiteRoleEnum.USER;
    this.banned_ = userPayload.banned ?? false;
    this.disabled_ = userPayload.disabled ?? false;
  }

  addChannel(channel: Channel): void {
    // se da por hecho que no existe el canal puesto que esta comprobación se hace antes
    if (channel.uuid !== undefined)
      this.channels_.add(channel);
  }

  hasChannel(channel: Channel): boolean {
    return this.channels_.has(channel);
  }

  removeChannel(channel: Channel): void {
    if (channel.uuid !== undefined)
      this.channels_.delete(channel);
  }

  addBlock(user: UserModel): void {
    if (!this.hasBlocked(user))
      this.blockUsers_.add(user);
  }

  hasBlocked(user: UserModel): boolean {
    return this.blockUsers_.has(user);
  }

  removeBlock(user: UserModel): void {
    this.blockUsers_.delete(user);
  }

  addConversation(conversation: Conversation): void {
    this.conversations_.add(conversation);
  }

  hasConversation(conversation: Conversation): boolean {
    return this.conversations_.has(conversation);
  }

  removeConversation(conversation: Conversation): void {
    this.conversations_.delete(conversation);
  }
  /*
  @Deprecated()
  addWatcher(user: User): void {
    this.watchers_.add(user);
  }

  @Deprecated()
  hasWatcher(user: User): boolean {
    return this.watchers_.has(user);
  }

  @Deprecated()
  removeWatcher(user: User): void {
    this.watchers_.delete(user);
  }
  */

  getChannels(): Channel[] {
    return Array.from(this.channels_);
  }

  getConversations(): Conversation[] {
    return Array.from(this.conversations_);
  }

  getCommonUsers(): UserModel[] {
    return Array.from(this.getCommonUsers_());
  }

  private getCommonUsers_(): Set<UserModel> {
    const uniqueUsers = new Set<UserModel>();

    this.channels_.forEach(channel => {
      for (const user of channel.getUsers()) {
        uniqueUsers.add(user);
      }
    })
    this.conversations_.forEach(conversation => {
      uniqueUsers.add(conversation.getUsersExcept(this)[0]);
    })
    return uniqueUsers;
  }

  /*
  @Deprecated()
  getWatchers(): User[] {
    const usersToNotify: Set<User> = this.getCommonUsers_();

    this.watchers_.forEach(user => {
      usersToNotify.add(user);
    })
    return Array.from(usersToNotify);
  }
  */

  destructor() {
    console.log("User destructor called");
  }

  get intraId(): number {
    return this.intraId_;
  }

  get uuid(): string {
    return this.uuid_;
  }

  set name(value: string) {
    this.name_ = value;
  }

  get name(): string {
    return this.name_!;
  }

  set socket(value: Socket) {
    if (this.socket_)
      this.socket_.disconnect();
    this.socket_ = value;
  }

  get socket(): Socket {
    if (!this.socket_)
      throw new PropertyUndefinedError("No socket");
    return this.socket_;
  }

  set status(value: UserStatusEnum) {
    this.status_ = value;
  }

  get siteRole(): UserSiteRoleEnum {
    return this.siteRole_;
  }

  set siteRole(value: UserSiteRoleEnum ) {
    this.siteRole_ = value;
  }
  
  ban() {
    this.banned_ = true;
  }

  unban() {
    this.banned_ = false;
  }

  getChannelsCount(): number {
    return this.channels_.size;
  }

  getConversationsCount(): number {
    return this.conversations_.size;
  }

  hasPrivileges(): boolean {
    return this.isOwner || this.isModerator;
  }

  get isOwner(): boolean {
    return this.siteRole_ === UserSiteRoleEnum.OWNER;
  }

  get isModerator(): boolean {
    return this.siteRole_ === UserSiteRoleEnum.MODERATOR;
  }

  get isBanned(): boolean {
    return this.banned_;
  }

  get isDisabled(): boolean {
    return this.disabled_;
  }

  is(user: UserModel): boolean {
    return this === user;
  }

  get DTO(): UserDTO {
    return new UserDTO(this);
  }
  // Otros métodos relacionados con el nick y los canales
};
