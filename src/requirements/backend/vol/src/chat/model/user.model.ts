import {
  Channel,
  Conversation,
} from '.';

import {
  UserPayload,
} from '../interface';

import {
  UserDTO,
} from '../dto';

import {
  UserStatusEnum,
  UserSiteRoleEnum,
  NotifyEventTypeEnum,
} from '../enum';

import {
  PropertyUndefinedError,
} from '../error';

import {
  User as UserDB,
} from '../../users/entities/user.entity';

import {
  Socket,
} from 'socket.io';

export class User {
  private readonly intraId_: number;
  private readonly id_: string;
  private name_?: string;
  private nickname_: string;
  private status_: UserStatusEnum;
  private socket_?: Socket;
  private siteRole_: UserSiteRoleEnum;
  private siteBanned_: boolean;
  private siteDisabled_: boolean;

  private readonly channels_ = new Set<Channel>; // Array para almacenar los canales a los que pertenece el nick
  private readonly conversations_ = new Set<Conversation>;
  private readonly blockUsers_ = new Set<User>;
  private readonly friendUsers_ = new Set<User>;
  private readonly watchUsers_ = new Set<User>;
  //private watchers_ = new Set<User>;
  //
  private readonly notifyCallback_: Function;

  constructor(notifyCallback: Function, userPayload: UserPayload) {
    if (!userPayload.intraId)
      throw new PropertyUndefinedError("userPayload.intraId not defined");
    this.intraId_ = userPayload.intraId;
    if (!userPayload.id)
      throw new PropertyUndefinedError("userPayload.id not defined");
    this.id_ = userPayload.id;
    if (!userPayload.nickname)
      throw new PropertyUndefinedError("userPayload.nickname not defined");
    this.nickname_ = userPayload.nickname;
    this.name_ = userPayload.name;
    this.socket_ = userPayload.socket;
    this.status_ = userPayload.status ?? UserStatusEnum.OFFLINE;
    this.siteRole_ = userPayload.siteRole ?? UserSiteRoleEnum.USER;
    this.siteBanned_ = userPayload.siteBanned ?? false;
    this.siteDisabled_ = userPayload.siteDisabled ?? false;
    this.notifyCallback_ = notifyCallback;
    this.notify_(NotifyEventTypeEnum.CREATE);
    //TODO: blockUsers y friendUsers
    //this.blockUsers_ = ....
    //this.friendUsers_ = ....
  }

  delete(): void {
    this.notify_(NotifyEventTypeEnum.DELETE);
  }

  private notify_(type: NotifyEventTypeEnum, changes?: {}) {
    this.notifyCallback_( [ this ], type, changes);
  }

  private childNotify_(objects: any[], type: NotifyEventTypeEnum, changes?: {}) {
    this.notifyCallback_( [...objects, this ], type, changes);
  }

  addChannel(channel: Channel): void {
    //throw new Error("bye");
    // se da por hecho que no existe el canal puesto que esta comprobación se hace antes
    if (channel.id !== undefined)
      this.channels_.add(channel);
  }

  hasChannel(channel: Channel): boolean {
    return this.channels_.has(channel);
  }

  removeChannel(channel: Channel): void {
    if (channel.id !== undefined)
      this.channels_.delete(channel);
  }

  addBlock(user: User): void {
    if (!this.hasBlocked(user))
      this.blockUsers_.add(user);
  }

  hasBlocked(user: User): boolean {
    return this.blockUsers_.has(user);
  }

  removeBlock(user: User): void {
    this.blockUsers_.delete(user);
  }

  addFriend(user: User): void {
    if (!this.hasFriend(user))
      this.friendUsers_.add(user);
  }

  hasFriend(user: User): boolean {
    return this.friendUsers_.has(user);
  }

  removeFriend(user: User): void {
    this.friendUsers_.delete(user);
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

  addWatcher(user: User): void {
    this.watchUsers_.add(user);
  }

  hasWatcher(user: User): boolean {
    return this.watchUsers_.has(user);
  }

  removeWatcher(user: User): void {
    this.watchUsers_.delete(user);
  }

  

  getChannels(): Channel[] {
    return Array.from(this.channels_);
  }

  getConversations(): Conversation[] {
    return Array.from(this.conversations_);
  }

  getCommonUsers(): User[] {
    return Array.from(this.getCommonUsers_());
  }

  getCommonUsersOnline(): User[] {
    return Array.from(this.getCommonUsers_()).filter((user) => user.status !== UserStatusEnum.OFFLINE);
  }

  private getCommonUsers_(): Set<User> {
    const uniqueUsers = new Set<User>();

    this.channels_.forEach(channel => {
      for (const user of channel.getUsers()) {
        uniqueUsers.add(user);
      }
    });
    this.conversations_.forEach(conversation => {
	    for (const user of conversation.getUsers()) {
		    uniqueUsers.add(user);
	    }
    });
    return uniqueUsers;
  }

  getWatchers(): User[] {
    const uniqueUsers = new Set<User>([
      ...Array.from(this.getCommonUsers_()).filter((user) => user.status !== UserStatusEnum.OFFLINE),
      ...Array.from(this.watchUsers_).filter((user) => user.status !== UserStatusEnum.OFFLINE),
    ]);

    console.log("User: getWatchers", uniqueUsers);
    return Array.from(uniqueUsers);
  }

  get intraId(): number {
    return this.intraId_;
  }

  get id(): string {
    return this.id_;
  }

  get name(): string | undefined {
    return this.name_;
  }

  set nickname(value: string) {
    if (this.nickname_ !== value) {
      this.nickname_ = value;
      this.notify_(NotifyEventTypeEnum.UPDATE, { nickname: value });
    }
  }

  get nickname(): string {
    return this.nickname_!;
  }

  set socket(value: Socket) {
    if (this.socket_) {
      //TODO: Se debe hacer una gestión en ChatManager
      this.socket_.emit('error', "A new connection has been established. Closing the socket");
      this.socket_.disconnect();
    }
    this.socket_ = value;
  }

  get socket(): Socket {
    if (!this.socket_)
      throw new PropertyUndefinedError("No socket");
    return this.socket_;
  }

  set status(value: UserStatusEnum) {
    if (this.status !== value) {
      this.status_ = value;
      this.notify_(NotifyEventTypeEnum.UPDATE, { status: value });
    }
  }

  get status(): UserStatusEnum {
    return this.status_;
  }

  get siteRole(): UserSiteRoleEnum {
    return this.siteRole_;
  }

  set siteRole(value: UserSiteRoleEnum ) {
    if (this.siteRole !== value) {
      this.siteRole_ = value;
      this.notify_(NotifyEventTypeEnum.UPDATE, { siteRole: value });
    }
  }

  getChannelsCount(): number {
    return this.channels_.size;
  }

  getConversationsCount(): number {
    return this.conversations_.size;
  }

  hasPrivileges(): boolean {
    return this.isSiteOwner || this.isSiteModerator;
  }

  get isSiteOwner(): boolean {
    return this.siteRole_ === UserSiteRoleEnum.OWNER;
  }

  get isSiteModerator(): boolean {
    return this.siteRole_ === UserSiteRoleEnum.MODERATOR;
  }

  get isSiteDisabled(): boolean {
    return this.siteDisabled_;
  }

  get isSiteBanned(): boolean {
    return this.siteBanned_;
  }

  set siteDisabled(value: boolean) {
    if (this.siteDisabled_ !== value) {
      this.siteDisabled_ = value;
      this.notify_(NotifyEventTypeEnum.UPDATE, { siteDisabled: value });
    }
  }

  set siteBanned(value: boolean) {
    if (this.siteBanned_ !== value) {
      this.siteBanned_ = value;
      this.notify_(NotifyEventTypeEnum.UPDATE, { siteBanned: value });
    }
  }

  is(user: User): boolean {
    return this === user;
  }

  get DTO(): UserDTO {
    return new UserDTO(this);
  }

  // Otros métodos relacionados con el nick y los canales
};
