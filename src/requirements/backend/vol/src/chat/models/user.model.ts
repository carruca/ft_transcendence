import {
  ChannelModel as Channel,
  ConversationModel as Conversation,
} from '.';

import { UserData } from '../interfaces';
import { UserDTO } from '../dto';

import {
  UserStatus,
  UserChannelRole,
  UserSiteRole
} from '../enums';

import { PropertyUndefinedError } from '../errors';

import { User as UserDB } from '../../users/entities/user.entity';

import { Socket } from 'socket.io';

export { UserData, UserDTO, UserStatus, UserChannelRole, UserSiteRole };

export class UserModel {
  //private intraId_: number;
  //private uuid_: string;
  //private name_: string;
  //private status_: UserStatus;
  //private socket_?: Socket;
  //private siteRole_: UserSiteRole;
  //private banned_: boolean;
  //private disabled_: boolean;

  private channels_ = new Set<Channel>; // Array para almacenar los canales a los que pertenece el nick
  private conversations_ = new Set<Conversation>;
  private blockUsers_ = new Set<UserModel>;
  //private watchers_ = new Set<User>;

  constructor(
    private readonly intraId_: number,
    private readonly uuid_: string,
    private name_: string,
    private siteRole_: UserSiteRole = UserSiteRole.NONE,
    private banned_: boolean = false,
    private disabled_: boolean = false,
    private status_: UserStatus = UserStatus.OFFLINE,
    private socket_?: Socket,
  ) {}

  /*
  constructor1(data: UserData | UserDB) {
    if (data instanceof UserDB) {
      this.intraId_ = data.intraId;
      this.uuid_ = data.id.toString();
      this.name_ = data.nickname!;
      this.socket_ = undefined;
      this.status_ = UserStatus.OFFLINE;
      this.siteRole_ = UserSiteRole.NONE;
      this.banned_ = false;
      this.disabled_ = false;
    } else {
      this.intraId_ = data.id;
      this.uuid_ = data.uuid;
      this.name_ = data.name;
      this.socket_ = data.socket;
      this.status_ = data.status ?? UserStatus.OFFLINE;
      this.siteRole_ = data.siteRole ?? UserSiteRole.NONE;
      this.banned_ = data.banned ?? false;
      this.disabled_ = data.disabled ?? false;
    }
  }
  */
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

  set status(value: UserStatus) {
    this.status_ = value;
  }

  get siteRole(): UserSiteRole {
    return this.siteRole_;
  }

  set siteRole(value: UserSiteRole ) {
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
    return (this.siteRole_ & (UserSiteRole.OWNER | UserSiteRole.MODERATOR)) !== 0;
  }

  isOwner(): boolean {
    return this.siteRole_ === UserSiteRole.OWNER;
  }

  isBanned(): boolean {
    return this.banned_;
  }

  isDisabled(): boolean {
    return this.disabled_;
  }

  is(user: UserModel): boolean {
    return this === user;
  }

  // Otros métodos relacionados con el nick y los canales
};
