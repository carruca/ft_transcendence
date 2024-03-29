import {
  User,
  Channel,
  Conversation,
  Challenge,
  Event,
  Response,
} from '../model';

import {
  UserPayload,
  ChannelPayload,
  ChannelUserPayload,
  ChallengePayload,
  ConversationPayload,
  EventPayload
} from '../interface';

import {
  UserDTO,
  ChannelDTO,
  ChannelUserDTO,
  ChannelSummaryDTO,
  ConversationDTO,
  EventDTO,
} from '../dto';

import {
  UserStatusEnum,
  UserSiteRoleEnum,
  EventTypeEnum,
  NotifyEventTypeEnum,
} from '../enum';

import {
  UserNotFoundError,
  UserNoSocketError,
  NotImplementedError,
  PropertyUndefinedError
} from '../error';

import {
  ChannelsService,
} from '../../channels/channels.service';

import {
  UsersService,
} from '../../users/users.service';

import {
  ChannelUser as ChannelUserDB,
} from '../../channels/entities/channel-user.entity';

import {
  CreateChannelDto,
} from '../../channels/dto/create-channel.dto';

import {
  CreateChannelUserDto,
} from '../../channels/dto/create-channel-user.dto';

import {
  MultiMap,
  BidirectionalMap,
  checkChannelName,
} from '../util';

import {
  Mode as GameMode,
} from '../../game/game.interface';

import {
  User as UserDB,
  UserMode,
} from '../../users/entities/user.entity';

import {
  Channel as ChannelDB,
} from '../../channels/entities/channel.entity';

import { Logger,
  Injectable,
} from '@nestjs/common';

import {
  Socket,
} from 'socket.io';

import {
  v4 as uuidv4,
} from 'uuid';

@Injectable()
export class ChatManager {
  private logger_ = new Logger(ChatManager.name, {
    timestamp: true,
  });

  private usersById_ = new Map<string, User>();
  private usersByNickname_ = new Map<string, User>();
  //private usersBySocket_ = new Map<Socket, User>();
  private usersByintraId_ = new Map<number, User>();
  private channelsById_ = new Map<string, Channel>();
  private channelsByName_ = new Map<string, Channel>();
  private conversationsById_ = new Map<string, Conversation>();
  private conversationsByUsers_ = new BidirectionalMap<User, Conversation>();
  private adminWatchers_ = new Set<User>();
  //TODO Challenge no anda fino aquí, debería ser el gestor y no la carga de datos
  private challengesByUsers_ = new BidirectionalMap<User, ChallengePayload>();
  private events_ = new MultiMap<string, Function>();
  private initialized_: boolean = false;

  constructor(
    private channelsService_: ChannelsService,
    private usersService_: UsersService,
  ) {
    this.logger_.log("Instance created");
  }

  /*
  **  properties
  */

  public getUserByIntraId(userIntraId: number): User | undefined {
    let user = this.usersByintraId_.get(userIntraId);

//    if (!user)
  //    this.raise_<void>('onChatUserGetInfo', { userIntraID, user });
    return user;
  }

  public getUserById(userid: string): User | undefined {
    return this.usersById_.get(userid);
  }

  public getUserByNickname(userNickname?: string): User | undefined {
    return this.usersByNickname_.get(userNickname!);
  }

  /*
  public getUserBySocket(userSocket: Socket): User {
    const user = this.usersBySocket_.get(userSocket);
    if (user === undefined)
      throw new UserNoSocketError("getUserBySocket can't find that socket.");
    return user;
  }
  */

  public getChannelByName(channelName: string): Channel | undefined {
    return this.channelsByName_.get(channelName);
  }

  public getChannelById(channelId: string): Channel | undefined {
    return this.channelsById_.get(channelId);
  }

  public getConversationByid(conversationid: string): Conversation | undefined {
    return this.conversationsById_.get(conversationid);
  }

  public getConversationByUsers(user1: User, user2: User): Conversation | undefined {
    return this.conversationsByUsers_.get(user1, user2);
  }

  public getConversationsByUser(user: User): Conversation[] {
    return this.conversationsByUsers_.getInnerKeys(user);
  }

  public getChallengeByUsers(user1: User, user2: User): ChallengePayload | undefined {
    return this.challengesByUsers_.get(user1, user2);
  }

  public getChannels(): Channel[] {
    return Array.from(this.channelsById_.values());
  }

  public getUsers(): User[] {
    return Array.from(this.usersById_.values());
  }

  public getUsersDTO(sourceUser?: User): UserDTO[] {
    return this.getUsers().map((user) => user.DTO(sourceUser));
  }

  public getChannelsDTO(): ChannelDTO[] {
    return this.getChannels().map((channel) => channel.DTO());
  }

  public getConversations(): Conversation[] {
    return Array.from(this.conversationsById_.values());
  }

  public addUserDB(userDB: UserDB ): User {
    let sourceUser = this.userFromDB_(userDB);

    if (this.usersById_.has(sourceUser.id))
      return this.getUserById(sourceUser.id)!;

    this.usersByintraId_.set(sourceUser.intraId, sourceUser);
    this.usersById_.set(sourceUser.id, sourceUser);
    this.usersByNickname_.set(sourceUser.nickname, sourceUser);

    //this.raise_<void>('onUserAdded', { sourceUser });
    return sourceUser;
  }

  public changeNickUserId(sourceUserid: string, nickname: string) {
    const sourceUser = this.getUserById(sourceUserid);

    if (sourceUser) {
//      this.raise_<void>('onUserNickChanged', { sourceUser, nickname });
      sourceUser.nickname = nickname;
    }
  }

  public addChannelDB(channelDB: ChannelDB ): Channel {
    const channel = this.channelFromDB_(channelDB);

    this.addChannel_(channel);
    return channel;
  }

  private addChannel_(channel: Channel) {
    this.channelsByName_.set(channel.name, channel);
    this.channelsById_.set(channel.id, channel);
  }

  /*
  **  methods
  */

  public async topicChannelId(sourceUser: User, channelId: string, topic: string): Promise<Response> {
    const channel = this.getChannelById(channelId);

    if (!channel) return Response.ChannelNotExists();
    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();
    if (!channel.hasPrivileges(sourceUser)) return Response.InsufficientPrivileges();
    if (channel.topic === topic) return Response.Success();

    channel.topic = topic;
    return Response.Success();
  }

  public async connectUser(sourceUser: User): Promise<Response> {
    if (sourceUser === undefined) return Response.UserNotExists();
    if (sourceUser.isSiteDisabled) return Response.AccountDisabled();
    if (sourceUser.isSiteBanned) return Response.BannedFromSite();

    //TODO falta la gestión de más de una conexión simultánea con el mismo usuario
    //this.usersBySocket_.set(sourceUser.socket, sourceUser);
    sourceUser.status = UserStatusEnum.ONLINE;
    this.raise_<void>('onUserConnected', { sourceUser });
    return Response.Success();
  }

  public async disconnectUser(sourceUser: User): Promise<Response> {
    this.adminWatchers_.delete(sourceUser);
    //this.usersBySocket_.delete(sourceUser.socket);

    this.raise_<void>('onUserDisconnect', { sourceUser });
    sourceUser.status = UserStatusEnum.OFFLINE;
    return Response.Success();
  }

  public createChallenge(user1: User, user2: User) {
    this.challengesByUsers_.set(user1, user2, { sourceUser: user1, targetUser: user2 });
  }

  public deleteChallenge(user1: User, user2: User) {
    this.challengesByUsers_.delete(user1, user2);
  }

  public async createConversation(user1: User, user2: User): Promise<Response> {
    let conversation: Conversation;
    const conversationData: ConversationPayload = {
      user1: user1,
      user2: user2,
    };

    if (user1.is(user2)) return Response.Success();

    if (this.raise_<boolean>('onConversationCreating', { conversationData }).includes(true))
      return Response.Denied();

    if (!conversationData.id) {
      this.logger_.debug("No id provided for new conversation. Generating one...");
      conversationData.id = uuidv4();
    }
    conversation = new Conversation(this.notify_.bind(this), conversationData);
    this.conversationsById_.set(conversation.id, conversation);
    this.conversationsByUsers_.set(conversation.user1, conversation.user2, conversation);
    this.raise_<void>('onConversationCreated', { conversation });
    return Response.Success();
  }

  public async deleteConversation(conversation?: Conversation | string): Promise<Response> {
    if (typeof conversation === "string")
      conversation = this.getConversationByid(conversation);
    if (!conversation) return Response.Success();
    this.conversationsById_.delete(conversation.id);
    this.conversationsByUsers_.delete(conversation.user1, conversation.user2);
    this.raise_<void>('onConversationDeleted', { conversation });
    return Response.Success();
  }

  private async addUserToChannel_(user: User, channel: Channel): Promise<void> {
    const createChannelUserDto: CreateChannelUserDto = {
      channelId: channel.id,
      userId: user.id,
      admin: false,
    };

    this.raise_<void>('onUserJoined', { channel, sourceUser: user, targetUsers: channel.getUsersOnline() });
    channel.addUser(user);
    user.addChannel(channel);
    this.raise_<void>('onChannelCreated', { channel, targetUsers: [ user ] });
    await this.channelsService_.createChannelUser(createChannelUserDto);
  }

  private async removeUserFromChannel_(user: User, channel: Channel): Promise<void> {
/*    await this.channelsService_.setActiveToChannel({
      channelId: channel.id,
      userId: user.id,
      mode: false,
    });
*/
    await this.channelsService_.removeChannelUser(channel.id, user.id);

    channel.removeUser(user);
    user.removeChannel(channel);
    this.raise_<void>('onUserParted', { channel, sourceUser: user, targetUsers: channel.getUsersOnline() });
    this.raise_<void>('onChannelDeleted', { channel, targetUsers: [ user ] });

    if (channel.isEmpty) {
       this.deleteChannel_(channel);
    }
  }

  public async userWatchUserId(sourceUser: User, targetUsersId: string[]): Promise<Response> {
    const targetUsers: User[] = [];

    if (targetUsersId == undefined) return Response.Success();

    for (const targetUserId of targetUsersId) {
      const targetUser = this.getUserById(targetUserId);

      if (!targetUser) return Response.UserNotExists();
      targetUser.addWatcher(sourceUser);
      targetUsers.push(targetUser);
    }

    //if (targetUser.hasWatcher(sourceUser)) return Response.Success();
    
    this.raise_<void>('onUserWatchUser', { sourceUser, targetUsers });
    return Response.Success();
  }


  public async userUnwatchUserId(sourceUser: User, targetUsersId: string): Promise<Response> {
    if (targetUsersId == undefined) return Response.Success();

    for (const targetUserId of targetUsersId) {
      const targetUser = this.getUserById(targetUserId);
      
      if (!targetUser) return Response.UserNotExists();
      targetUser.removeWatcher(sourceUser);
    }

    return Response.Success();
  }

  public async adminWatch(sourceUser: User): Promise<Response> {
    if (!sourceUser.hasPrivileges()) return Response.InsufficientPrivileges();

    this.adminWatchers_.add(sourceUser);
    this.raise_<void>('onUserAdminData', { sourceUser, channelsDTO: this.getChannelsDTO(), usersDTO: this.getUsersDTO(sourceUser) });
    return Response.Success();
  }

  public async adminUnwatch(sourceUser: User): Promise<Response> {
    if (!sourceUser.hasPrivileges()) return Response.InsufficientPrivileges();

    this.adminWatchers_.delete(sourceUser);
    return Response.Success();
  }

  public async createChannelName(sourceUser: User, channelName: string, password?: string): Promise<Response> {
    let channel = this.getChannelByName(channelName);

    if (!checkChannelName(channelName)) return Response.BadChannelName();
    if (channel) return Response.ChannelExists();

    const channelDB = await this.channelsService_.create({
      name: channelName,
      ownerId: sourceUser.id,
      password: password ?? "",
    });

    channel = this.addChannelDB(channelDB);
    channel.createEventGeneric(EventTypeEnum.CREATE, sourceUser);
    //this.raise_<void>('onChannelCreated', { channel, sourceUser });
    //TODO enviar a los que están en el panel de admin.
    return Response.Success();
  }

  public async deleteChannelId(user: User, channelId: string): Promise<Response> {
    const channel = this.getChannelById(channelId);

    if (!channel) return Response.ChannelNotExists();
    if (!channel.isOwner(user)) return Response.InsufficientPrivileges();

    //this.raise_<void>('onChannelDeleted', { channel, user });
    this.deleteChannel_(channel);
    //this.destroyChannel_(channel);

    return Response.Success();
  }

  public async joinChannelId(sourceUser: User, channelId: string, password?: string): Promise<Response> {
    let channel = this.getChannelById(channelId);

    if (!channel) return Response.ChannelNotExists();
    if (channel.hasUser(sourceUser)) return Response.AlreadyInChannel();
    if (password == undefined) password = "";
    if (!await this.channelsService_.verifyChannelPassword(channel.id, password)) return Response.BadChannelPassword();
    if (channel.isBanned(sourceUser)) return Response.BannedFromChannel();

    //this.raise_<void>('onUserJoined', { channel, sourceUser });
    await this.addUserToChannel_(sourceUser, channel);
    //this.raise_<void>('onChannelCreated', { channel, targetUsers: [ sourceUser ] });
    channel.createEventGeneric(EventTypeEnum.JOIN, sourceUser);
    return Response.Success();
  }

  public async partChannelId(sourceUser: User, channelId: string): Promise<Response> {
    let channel = this.getChannelById(channelId);

    if (!channel) return Response.ChannelNotExists();
    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();

    //this.raise_<void>('onChannelDeleted', { channel, targetUsers: [ sourceUser ] });
    channel.createEventGeneric(EventTypeEnum.PART, sourceUser);
    await this.removeUserFromChannel_(sourceUser, channel);
    return Response.Success();
  }

  private async deleteChannel_(channel: Channel): Promise<void> {
    this.channelsById_.delete(channel.id);
    this.channelsByName_.delete(channel.name);

    await this.channelsService_.remove(channel.id);
    channel.delete();
  }

  public async summarizeChannels(sourceUser: User): Promise<Response> {
    let channelsSummaryDTO: ChannelSummaryDTO[] = [];

    for (const channel of this.getChannels()) {
      if (!channel.hasUser(sourceUser) && !channel.isBanned(sourceUser)) {
        channelsSummaryDTO.push(channel.summaryDTO);
      }
    }

    this.raise_<void>('onUserChannelsSummarized', { sourceUser, channelsSummaryDTO })
    return Response.Success();
  }

  adminListChannels(sourceUser: User): void {
    let channelsDTO: ChannelDTO[] = [];

  }

  private getPrivilegeLevel_(user: User, channel?: Channel): number {
    if (user.siteRole === UserSiteRoleEnum.OWNER) return 4;
    if (user.siteRole === UserSiteRoleEnum.MODERATOR) return 3;
    if (channel) {
      if (channel.isOwner(user)) return  2;
      if (channel.isAdmin(user)) return 1;
    }
    return 0;
  }

  private hasPrivilegesOver_(sourceUser: User, targetUser: User, channel?: Channel): boolean {
    const sourceLevel = this.getPrivilegeLevel_(sourceUser, channel);
    const targetLevel = this.getPrivilegeLevel_(targetUser, channel);

    return (sourceLevel > targetLevel);
  }

  getAdminWatchers(): User[] {
    return Array.from(this.adminWatchers_.values());
  }

  public async spectateChallengeUserId(sourceUser: User, targetUserid: string): Promise<Response> {
    const targetUser = this.getUserById(targetUserid);

    if (!targetUser) return Response.UserNotExists();
    if (targetUser.hasBlocked(sourceUser)) return Response.Success();
    if (sourceUser.status === UserStatusEnum.IN_GAME) return Response.YoureInGame();
    if (targetUser.status !== UserStatusEnum.IN_GAME) return Response.UserInGame();

    //TODO advertir al resto de usuarios el cambio de estado.
    this.raise_<void>('onUserChallengeSpectated', { sourceUser, targetUser })
    return Response.Success();
  }

  public async closeChannelId(sourceUser: User, channelId: string, message: string): Promise<Response> {
    const channel = this.getChannelById(channelId);

    if (!channel) return Response.ChannelNotExists();
    if (!channel.hasUser(sourceUser) && !sourceUser.hasPrivileges()) return Response.NotInChannel();
    if (!sourceUser.hasPrivileges() && !channel.isOwner(sourceUser)) return Response.InsufficientPrivileges();

    this.raise_<void>("onChannelClosed", { channel, sourceUser });
    await this.cleanChannel_(channel);
    await this.deleteChannel_(channel);
    return Response.Success();
  }

  public async passwordChannelId(sourceUser: User, channelId: string, password?: string): Promise<Response> {
    const channel = this.getChannelById(channelId);

    //TODO: password debe permitir caracteres extraños?
    if (!channel)
      return Response.ChannelNotExists();
    if (!channel.hasPrivileges(sourceUser))
      return Response.InsufficientPrivileges();
    if (!password) {
      if (channel.password === false) return Response.SameChannelPassword();
    } else {
      if (await this.channelsService_.verifyChannelPassword(channel.id, password)) return Response.SameChannelPassword();
    }

    channel.password = password ? true : false;
    if (password == undefined) {
      await this.channelsService_.removeChannelPassword(channel.id);
    } else {
      await this.channelsService_.setChannelPassword(channel.id, password);
    }
    channel.createEventGeneric(EventTypeEnum.PASSWORD, sourceUser);
    return Response.Success();
  }

  public async banListChannelId(sourceUser: User, channelId: string): Promise<Response> {
    const channel = this.getChannelById(channelId);
    
	if (!channel) return Response.ChannelNotExists();
	if (!sourceUser.hasPrivileges()) {
		//if (!channel.hasUser(sourceUser)) return Response.NotInChannel();
		//if (!channel.hasPrivileges(sourceUser)) return Response.InsufficientPrivileges();
	}
    this.raise_<void>('onUserChannelBanListed', { sourceUser, channel });
    return Response.Success();
  }

  public async kickUserFromChannelId(sourceUser: User, channelId: string, targetUserid: string, message?: string): Promise<Response> {
    const channel = this.getChannelById(channelId);
    const targetUser = this.getUserById(targetUserid);

    if (!channel) return Response.ChannelNotExists();
    if (!targetUser) return Response.UserNotExists();
	if (!sourceUser.hasPrivileges()) {
    	if (!channel.hasPrivileges(sourceUser)) return Response.InsufficientPrivileges();
	    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();
    	if (channel.owner === targetUser) return Response.InsufficientPrivileges();
	}
	if (!channel.hasUser(targetUser)) return Response.NotInChannel();
	if (!this.hasPrivilegesOver_(sourceUser, targetUser, channel)) return Response.HigherPrivileges();
	
    channel.createEventAction(EventTypeEnum.KICK, sourceUser, targetUser, message);
    //this.raise_<void>("onChannelClosed", { channel, targetUser });
    channel.demoteUser(targetUser);
    await this.removeUserFromChannel_(targetUser, channel);
    return Response.Success();
  }

  public async muteUserFromChannelId(sourceUser: User, channelId: string, targetUserid: string): Promise<Response> {
    const channel = this.getChannelById(channelId);
    const targetUser = this.getUserById(targetUserid);

    if (!channel) return Response.ChannelNotExists();
    if (!targetUser) return Response.UserNotExists();
	if (!sourceUser.hasPrivileges()) {
    	if (!channel.hasPrivileges(sourceUser)) return Response.InsufficientPrivileges();
	    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();
    	if (channel.owner === targetUser) return Response.InsufficientPrivileges();
	}
	if (!channel.hasUser(targetUser)) return Response.NotInChannel();
	if (channel.isMuted(targetUser)) return Response.UserAlreadyMuted();
	if (!this.hasPrivilegesOver_(sourceUser, targetUser, channel)) return Response.HigherPrivileges();

    channel.muteUser(targetUser);
    channel.createEventAction(EventTypeEnum.MUTE, sourceUser, targetUser);
    this.channelsService_.setMutedToChannelUser({
      channelId: channel.id,
      userId: targetUser.id,
      mode: true,
    });
    return Response.Success();

  }

  public async unmuteUserFromChannelId(sourceUser: User, channelId: string, targetUserid: string): Promise<Response> {
    const channel = this.getChannelById(channelId);
    const targetUser = this.getUserById(targetUserid);

	if (!channel) return Response.ChannelNotExists();
    if (!targetUser) return Response.UserNotExists();
	if (!sourceUser.hasPrivileges()) {
    	if (!channel.hasPrivileges(sourceUser)) return Response.InsufficientPrivileges();
	    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();
    	if (channel.owner === targetUser) return Response.InsufficientPrivileges();
	}
	if (!channel.hasUser(targetUser)) return Response.NotInChannel();
	if (!channel.isMuted(targetUser)) return Response.UserNotMuted();
	if (!this.hasPrivilegesOver_(sourceUser, targetUser, channel)) return Response.HigherPrivileges();

    channel.unmuteUser(targetUser);
    channel.createEventAction(EventTypeEnum.UNMUTE, sourceUser, targetUser);
    this.channelsService_.setMutedToChannelUser({
      channelId: channel.id,
      userId: targetUser.id,
      mode: false,
    });
    return Response.Success();
  }

  public async banUserFromChannelId(sourceUser: User, channelId: string, targetUserid: string): Promise<Response> {
    const channel = this.getChannelById(channelId);
    const targetUser = this.getUserById(targetUserid);

	if (!channel) return Response.ChannelNotExists();
    if (!targetUser) return Response.UserNotExists();
	if (!sourceUser.hasPrivileges()) {
    	if (!channel.hasPrivileges(sourceUser)) return Response.InsufficientPrivileges();
	    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();
    	if (channel.owner === targetUser) return Response.InsufficientPrivileges();
	}
	if (!channel.hasUser(targetUser)) return Response.NotInChannel();
	if (channel.isBanned(targetUser)) return Response.UserAlreadyBanned();
	if (!this.hasPrivilegesOver_(sourceUser, targetUser, channel)) return Response.HigherPrivileges();

    channel.banUser(targetUser);
    channel.demoteUser(targetUser);
    channel.createEventAction(EventTypeEnum.BAN, sourceUser, targetUser);
    this.removeUserFromChannel_(targetUser, channel);
    await this.usersService_.createBan({ userId: targetUser.id, channelId: channel.id });
    return Response.Success();
  }

  public async unbanUserFromChannelId(sourceUser: User, channelId: string, targetUserid: string): Promise<Response> {
    const channel = this.getChannelById(channelId);
    const targetUser = this.getUserById(targetUserid);

	if (!channel) return Response.ChannelNotExists();
    if (!targetUser) return Response.UserNotExists();
	if (!sourceUser.hasPrivileges()) {
    	if (!channel.hasPrivileges(sourceUser)) return Response.InsufficientPrivileges();
	    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();
    	if (channel.owner === targetUser) return Response.InsufficientPrivileges();
	}
	if (!channel.isBanned(targetUser)) return Response.UserNotBanned();
	if (!this.hasPrivilegesOver_(sourceUser, targetUser, channel)) return Response.HigherPrivileges();

    this.raise_<void>("onUserUnbanned", { channel, sourceUser, targetUser });
    channel.unbanUser(targetUser);
    channel.createEventAction(EventTypeEnum.UNBAN, sourceUser, targetUser);
    await this.usersService_.removeBan(targetUser.id, channel.id);
    return Response.Success();
  }

  public async promoteUserInChannelId(sourceUser: User, channelId: string, targetUserid: string): Promise<Response> {
    const channel = this.getChannelById(channelId);
    const targetUser = this.getUserById(targetUserid);

	if (!channel) return Response.ChannelNotExists();
    if (!targetUser) return Response.UserNotExists();
	if (!sourceUser.hasPrivileges()) {
    	if (!channel.hasPrivileges(sourceUser)) return Response.InsufficientPrivileges();
	    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();
    	if (channel.owner === targetUser) return Response.InsufficientPrivileges();
	}
	if (!channel.hasUser(targetUser)) return Response.NotInChannel();
	if (channel.isAdmin(targetUser)) return Response.UserAlreadyAdmin();
	if (!this.hasPrivilegesOver_(sourceUser, targetUser, channel)) return Response.HigherPrivileges();

    channel.promoteUser(targetUser);
    channel.createEventAction(EventTypeEnum.PROMOTE, sourceUser, targetUser);
    this.channelsService_.setAdminToChannelUser({
      channelId: channel.id,
      userId: targetUser.id,
      mode: true,
    });
    return Response.Success();
  }

  public async demoteUserInChannelId(sourceUser: User, channelId: string, targetUserid: string): Promise<Response> {
    const channel = this.getChannelById(channelId);
    const targetUser = this.getUserById(targetUserid);

	if (!channel) return Response.ChannelNotExists();
    if (!targetUser) return Response.UserNotExists();
	if (!sourceUser.hasPrivileges()) {
    	if (!channel.hasPrivileges(sourceUser)) return Response.InsufficientPrivileges();
	    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();
    	if (channel.owner === targetUser) return Response.InsufficientPrivileges();
	}
	if (!channel.hasUser(targetUser)) return Response.NotInChannel();
	if (!channel.isAdmin(targetUser)) return Response.UserNotAdmin();
	if (!this.hasPrivilegesOver_(sourceUser, targetUser, channel)) return Response.HigherPrivileges();

    channel.demoteUser(targetUser);
    channel.createEventAction(EventTypeEnum.DEMOTE, sourceUser, targetUser);
    this.channelsService_.setAdminToChannelUser({
      channelId: channel.id,
      userId: targetUser.id,
      mode: false,
    });
    //this.raise_<void>('onUserDemoted', { channel, sourceUser, targetUser });
    return Response.Success();
  }

  public async requestChallengeUserId(sourceUser: User, targetUserid: string, gameMode?: GameMode): Promise<Response> {
    const targetUser = this.getUserById(targetUserid);

    if (!targetUser) return Response.UserNotExists();
    if (sourceUser === targetUser) return Response.Success();
    //if (this.getChallengeByUsers(sourceUser, targetUser)) return Response.PendingChallenge();
    if (sourceUser.hasBlocked(targetUser)) return Response.Success();
    if (targetUser.hasBlocked(sourceUser)) return Response.Success();
    if (sourceUser.status === UserStatusEnum.OFFLINE) return Response.UserNotConnected();
    if (sourceUser.status === UserStatusEnum.IN_GAME) return Response.UserInGame();
    if (sourceUser.status === UserStatusEnum.AWAY) return Response.UserAway();

    //if (this.raise_<boolean>('onUserChallengeRequested', { sourceUser, targetUser }).includes(true))
    //  return Response.Denied();
    //this.createChallenge(sourceUser, targetUser);
    this.raise_<void>('onUserChallengeRequested', { sourceUser, targetUser, gameMode });
    return Response.Success();
  }

  public async acceptChallengeUserId(sourceUser: User, targetUserid: string, gameMode?: GameMode): Promise<Response> {
    const targetUser = this.getUserById(targetUserid);

    if (!targetUser) return Response.UserNotExists();
    if (sourceUser === targetUser) return Response.Success();

    //const challenge = this.getChallengeByUsers(sourceUser, targetUser);

    //if (!challenge) return Response.Success();
    //if (challenge.targetUser !== targetUser) return Response.Success();
    if (sourceUser.status === UserStatusEnum.OFFLINE) return Response.UserNotConnected();
    if (sourceUser.status === UserStatusEnum.IN_GAME) return Response.UserInGame();
    if (sourceUser.status === UserStatusEnum.AWAY) return Response.UserAway();

    if (this.raise_<boolean>('onUserChallengeAccepting', { sourceUser, targetUser }).includes(true))
      return Response.Denied();
    this.deleteChallenge(sourceUser, targetUser);
    this.raise_<void>('onUserChallengeAccepted', { sourceUser, targetUser, gameMode });
    return Response.Success();
  }

  public async rejectChallengeUserId(sourceUser: User, targetUserid: string): Promise<Response> {
    const targetUser = this.getUserById(targetUserid);

    if (!targetUser) return Response.UserNotExists();
    if (sourceUser === targetUser) return Response.Success();

    //const challenge = this.getChallengeByUsers(sourceUser, targetUser);

    //if (!challenge) return Response.Success();
    //if (challenge.targetUser !== targetUser) return Response.Success();

    if (this.raise_<boolean>('onUserChallengeRejecting', { sourceUser, targetUser }).includes(true))
      return Response.Denied();
    this.deleteChallenge(sourceUser, targetUser);
    this.raise_<void>('onUserChallengeRejected', { sourceUser, targetUser });
    return Response.Success();
  }

  public async blockUserId(sourceUser: User, targetUserid: string): Promise<Response> {
    const targetUser = this.getUserById(targetUserid);

    if (!targetUser) return Response.UserNotExists();
    if (sourceUser === targetUser) return Response.SameUser();
    if (sourceUser.hasBlocked(targetUser)) return Response.UserAlreadyBlocked();

    sourceUser.addBlock(targetUser);

    this.raise_<void>('onUserUpdated', {
      sourceUser: targetUser,
      targetUsers: [ sourceUser ],
      changes: {
        blocked: true,
    }});

    await this.usersService_.createBlock({
      userId: sourceUser.id,
      blockId: targetUser.id,
    });
    return Response.Success();
  }

  public async unblockUserId(sourceUser: User, targetUserid: string): Promise<Response> {
    const targetUser = this.getUserById(targetUserid);

    if (!targetUser) return Response.UserNotExists();
    if (sourceUser === targetUser) return Response.SameUser();
    if (!sourceUser.hasBlocked(targetUser)) return Response.UserNotBlocked();

 //   if (this.raise_<boolean>('onUserUnblocking', { sourceUser, targetUser }).includes(true))
   //   return Response.Denied();

    //this.raise_<void>('onUserUnblocked', { sourceUser, targetUser });
    sourceUser.removeBlock(targetUser);

    this.raise_<void>('onUserUpdated', {
      sourceUser: targetUser,
      targetUsers: [ sourceUser ],
      changes: {
        blocked: false,
    }});

    await this.usersService_.removeBlock(sourceUser.id, targetUser.id);
    return Response.Success();
  }

  public async sitePromoteUserId(sourceUser: User, targetUserId: string): Promise<Response> {
    const targetUser = this.getUserById(targetUserId);

    if (!targetUser) return Response.UserNotExists();
	if (!this.hasPrivilegesOver_(sourceUser, targetUser)) return Response.HigherPrivileges();
	if (targetUser.isSiteModerator) return Response.UserAlreadyModerator();

    targetUser.siteRole = UserSiteRoleEnum.MODERATOR;
    await this.usersService_.setMode(targetUser.id, +UserSiteRoleEnum.MODERATOR);
    return Response.Success();
  }

  public async siteDemoteUserId(sourceUser: User, targetUserId: string): Promise<Response> {
    const targetUser = this.getUserById(targetUserId);

    if (!targetUser) return Response.UserNotExists();
	if (!this.hasPrivilegesOver_(sourceUser, targetUser)) return Response.HigherPrivileges();
	if (!targetUser.isSiteModerator) return Response.UserNotModerator();

    targetUser.siteRole = UserSiteRoleEnum.USER;
    await this.usersService_.setMode(targetUser.id, +UserSiteRoleEnum.USER);
    return Response.Success();
  }

  public async siteBanUserId(sourceUser: User, targetUserid: string): Promise<Response> {
    const targetUser = this.getUserById(targetUserid);

    if (!targetUser) return Response.UserNotExists();
	if (!this.hasPrivilegesOver_(sourceUser, targetUser)) return Response.HigherPrivileges();
	if (targetUser.isSiteBanned) return Response.UserAlreadyBanned();

    targetUser.siteBanned = true;
    await this.usersService_.setBanned(targetUser.id, true)
    if (targetUser.socket) {
      targetUser.socket.emit('reterror',
          JSON.stringify({
          event: 'connection',
          code: 4,
          message: "You have been banned from this site",
      }));
      targetUser.socket.disconnect();
    }
    return Response.Success();
  }

  public async siteUnbanUserId(sourceUser: User, targetUserid: string): Promise<Response> {
    const targetUser = this.getUserById(targetUserid);

    if (!targetUser) return Response.UserNotExists();
	if (!this.hasPrivilegesOver_(sourceUser, targetUser)) return Response.HigherPrivileges();
	if (!targetUser.isSiteBanned) return Response.UserNotBanned();

    targetUser.siteBanned = false;
    await this.usersService_.setBanned(targetUser.id, false)
    return Response.Success();
  }

  public async sendMessageChannelId(sourceUser: User, channelId: string, message: string): Promise<Response> {
    const channel = this.getChannelById(channelId);

    if (!channel) return Response.ChannelNotExists();
    if (channel.isBanned(sourceUser)) return Response.BannedFromChannel();
    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();
    if (channel.isMuted(sourceUser)) return Response.CannotSendToChannel();

  //  if (this.raise_<boolean>("onChannelMessageSending", payload).includes(true))
 //     return Response.Denied();

    channel.createEventGeneric(EventTypeEnum.MESSAGE, sourceUser, message);
    //this.raise_<void>("onChannelMessageSended", { sourceUser, channel, event });
    return Response.Success();
  }


  public async sendMessageUserId(sourceUser: User, targetUserId: string, message: string): Promise<Response> {
    const targetUser = this.getUserById(targetUserId);

    if (!targetUser) return Response.UserNotExists();

    const event = new Event({
      type: EventTypeEnum.MESSAGE,
      sourceUser: sourceUser,
      targetUser: targetUser,
      value: message,
    });

    this.raise_<void>("onUserMessageSended", { targetUser: sourceUser, event });

    if (!targetUser.hasBlocked(sourceUser)) {
      this.raise_<void>("onUserMessageSended", { targetUser, event });
    }
    return Response.Success();
  }

  public async messageConversationid(sourceUser: User, conversationid: string, message: string): Promise<Response> {
    const conversation = this.getConversationByid(conversationid);

    if (!conversation) return Response.ConversationNotExists();
    if (conversation.hasBlocked(sourceUser)) return Response.Success();

    //if (this.raise_<boolean>("onUserMessageSending", payload).includes(true))
    //  return Response.Denied();
    conversation.createEventMessage(sourceUser, message);
    //this.raise_<void>("onUserMessageSended", { sourceUser, targetConversation, event });
    return Response.Success();
  }

  public autoSubscribeEvents(instance: any) {
    let currentPrototype = Object.getPrototypeOf(instance);
    //si es una herencia, debemos bajar un nivel obteniendo el protitpo de nuevo.
    currentPrototype = Object.getPrototypeOf(currentPrototype);

    for (const propertyName of Object.getOwnPropertyNames(currentPrototype)) {
      const method: Function = instance[propertyName];
      if (method) {
        const event = Reflect.getMetadata('chatmanager:event', method);
        if (event) {
          this.subscribe(event, method, instance);
        }
      }
    }
  }

  public subscribe(eventString: string, method: Function, instance: any): boolean {
    //let event = this.getEventFromString_(eventString);
    const baseName = Object.getPrototypeOf(Object.getPrototypeOf(instance)).constructor.name;
    this.logger_.log(`${baseName} subscribed to the '${eventString}' event`);
    //this.logger_.debug(`${instance.constructor.name} [${method.name}] has subscribed to the '${eventString}' event`);
    // TODO: verificar si callback cumple con el prototipo del event
    //if (event && this.checkCallbackType_(event, callback)) {
    this.events_.set(eventString, method.bind(instance));
    return true;
    //}
    return false;
  }

  public unsubscribe(event: string, method: Function, instance: any): boolean {
    return this.events_.delete(event, method.bind(instance));
  }

  public async raiseInitializationEvents(): Promise<void> {
    this.usersService_.setDefaultStatusToAllUsers();
    this.logger_.log("Raising initialization events");
    //await this.asyncRaise_<void>('onChatManagerInitialized');
    await this.asyncRaise_<void>('onChatDataLoad');
    this.initialized_ = true;
    this.logger_.log("Finalize initialization events");
  }

  private raise_<T>(event: string, ...params: any[]): T[] {
    const results: T[] = [];
    const callbacks = this.events_.get(event);

    callbacks?.forEach(callback => {
      const result = callback(...params);
      results.push(result as T);
    });
    return results;
  }

  private async asyncRaise_<T>(event: string, ...params: any[]): Promise<T[]> {
    const results: T[] = [];
    const callbacks = this.events_.get(event);

    if (callbacks) {
      for (const callback of callbacks) {
        const result = await callback(...params);
        results.push(result as T);
      }
    }
    return results;
  }

  public updateUserStatus(user: User, updatedStatus: UserStatusEnum) {
    user.status = updatedStatus;
    this.logger_.log(`${user.name} status changed to ${['Offline', 'Online', 'In game', 'Away'][updatedStatus]}`);
    //throw new NotImplementedError("updateUserStatus: function not implemented yet.");

  }
  /*
  private channelFromDTO_(dto: ChannelDTO): Channel {
    const owner = this.getUserById(dto.ownerid);
    let topic: ChannelTopic | undefined;

    if (!owner)
      throw new UserNotFoundError("channelFromDTO: ownerid user not found.");

    if (dto.topic) {
      const topicUser = this.getUserById(dto.topic.userid);

      if (!topicUser)
        throw new UserNotFoundError("channelFromDTO: topicUserid user not found.");
      topic = {
        user: topicUser,
        setDate: dto.topic.setDate,
        value: dto.topic.value,
      };
    }

    return new Channel(
      dto.id,
      dto.name,
      owner,
      dto.createdDate,
      topic,
      dto.password,
    );
  }
  */

  private getObserversOf_(object: any): Set<any> {
    if (object instanceof User) {
      return new Set([...object.getCommonUsersOnline() ]);
    }
    else if (object instanceof Channel) {
      return new Set([...object.getUsersOnline()]);
    }
    return new Set();
  }

  private notifyUser_(objects: any[], type: NotifyEventTypeEnum, changes: any) {
    const [ sourceUser ] = objects;
	  const targetUsers = this.getObserversOf_(sourceUser);

    if (type === NotifyEventTypeEnum.UPDATE) {
      if (changes.status !== undefined) {
        this.usersService_.setStatus(sourceUser.id, changes.status);
      }
	    this.raise_<void>('onUserUpdated', { sourceUser, targetUsers, changes });
	  }
	  else if (type === NotifyEventTypeEnum.CREATE) {
	    this.raise_<void>('onUserCreated', { sourceUser, targetUsers });
	  }
	  else if (type === NotifyEventTypeEnum.DELETE) {
	    this.raise_<void>('onUserDeleted', { sourceUser, targetUsers });
	  //const targetUSers = this.
	  //   this.raise_<void>('onUserDeleted', { sourceUser, targetUsers });
	  }
  }

  private notifyChannel_(objects: any[], type: NotifyEventTypeEnum, changes: {}) {
    const [ channel ] = objects;
	  const targetUsers = this.getObserversOf_(channel);

    if (type === NotifyEventTypeEnum.UPDATE) {
	    this.raise_<void>('onChannelUpdated', { channel, targetUsers, changes });
	  }
	  else if (type === NotifyEventTypeEnum.CREATE) {
      this.raise_<void>('onChannelCreated', { channel, targetUsers });
	  }
	  else if (type === NotifyEventTypeEnum.DELETE) {
      this.raise_<void>('onChannelDeleted', { channel, targetUsers });
	  }
  }

  private notifyConversation_(objects: any[], type: NotifyEventTypeEnum, changes: {}) {
    const [ conversation ] = objects;
	  const targetUsers = conversation.getUsers();

    if (type === NotifyEventTypeEnum.UPDATE) {
	    this.raise_<void>('onConversationUpdated', { conversation, targetUsers, changes });
    }
    else if (type === NotifyEventTypeEnum.CREATE) {
      this.raise_<void>('onConversationCreated', { conversation, targetUsers });
    }
    else if (type === NotifyEventTypeEnum.DELETE) {
	    this.raise_<void>('onConversationDeleted', { conversation, targetUsers });

    }
	}

	private notifyEvent_(objects: any[], type: NotifyEventTypeEnum, changes: {}) {
	  const [ event, object ] = objects;
	  const targetUsers = object.getUsersOnline();

    if (type === NotifyEventTypeEnum.UPDATE) {
      if (object instanceof Channel)
	      this.raise_<void>('onChannelEventUpdated', { channel: object, event, targetUsers, changes });
	    else if (object instanceof Conversation)
	      this.raise_<void>('onConversationEventUpdated', { conversation: object, event, targetUsers, changes });
    }
    else if (type === NotifyEventTypeEnum.CREATE) {
      if (object instanceof Channel) {
	      this.raise_<void>('onChannelEventCreated', { channel: object, event, targetUsers });
	    }
	    else if (object instanceof Conversation)
	      this.raise_<void>('onConversationEventCreated', { conversation: object, event, targetUsers });
    }
    else if (type === NotifyEventTypeEnum.DELETE) {
      if (object instanceof Channel)
	      this.raise_<void>('onChannelEventDeleted', { channel: object, event, targetUsers });
	    else if (event instanceof Conversation)
	      this.raise_<void>('onConversationEventDeleted', { conversation: object, event, targetUsers });
    }
	}

  private notify_(objects: any[], type: NotifyEventTypeEnum, changes: {} = {}) {
    if (!this.initialized_) return;
    if (objects[0] instanceof User) return this.notifyUser_(objects, type, changes);
    if (objects[0] instanceof Channel) return this.notifyChannel_(objects, type, changes);
	  if (objects[0] instanceof Conversation) return this.notifyConversation_(objects, type, changes);
	  if (objects[0] instanceof Event) return this.notifyEvent_(objects, type, changes);
  }

  private userFromDB_(userDB: UserDB): User {
    const blockUsers: string[] = [];
    if (!userDB.nickname)
      throw new PropertyUndefinedError("userFromDB: nickname is not set");

    if (userDB.blocks) {
      for (const block of userDB.blocks) {
          blockUsers.push(block.blockId);
      }
    }

    return new User(this.notify_.bind(this), {
      intraId: userDB.intraId,
      id: userDB.id,
      nickname: userDB.nickname,
      siteRole: userDB.mode as number,
      blocks: blockUsers,
      siteBanned: userDB.banned,
      siteDisabled: userDB.disabled,
    });
  }

  private channelFromDB_(channelDB: ChannelDB): Channel {
    const owner = this.getUserById(channelDB.ownerId);
    const banUsers: User[] = [];
    let topicUser: User | undefined;

    if (!owner) {
      throw new UserNotFoundError("channelFromDB: ownerId user not found.");
    }

    if (channelDB.topicUser) {
      topicUser = this.getUserById(channelDB.topicUser);

      if (!topicUser) {
        throw new UserNotFoundError("channelFromDB: topicUser not found on database.")
      }
    }

    if (channelDB.bans) {
      for (const ban of channelDB.bans) {
        const banUser = this.getUserById(ban.user.id);

        if (banUser)
          banUsers.push(banUser);
        else
          throw new UserNotFoundError("channelFromDB: banUser not found on memory.");
      }
    }

    const channel = new Channel(this.notify_.bind(this), {
      id: channelDB.id,
      name: channelDB.name,
      owner: owner,
      topicUser: topicUser,
      topicSetDate: channelDB.topicSetDate!,
      topic: channelDB.topic!,
      createdDate: channelDB.createdDate,
      password: channelDB.password !== "",
      bans: banUsers,
    });

    if (channelDB.users) {
      channelDB.users.map(channelUserDB => this.addChannelUserFromDB_(channel, channelUserDB));
    }
    this.notify_([ channel ], NotifyEventTypeEnum.CREATE);
    return channel;
  }

  private addChannelUserFromDB_(channel: Channel, channelUserDB: ChannelUserDB) {
    const user = this.getUserById(channelUserDB.user.id);

    if (!user) {
      throw new UserNotFoundError("addChannelUserFromDB_: getUserById not found in memory");
    }
    user.addChannel(channel);
    channel.addUser(user);
    channel.setOptions(user, channelUserDB);
 }

  private async cleanChannel_(channel: Channel): Promise<void> {
    for (const user of channel.getUsers()) {
      channel.removeUser(user);
      this.raise_<void>('onChannelUserDeleted', { channel, targetUsers: [ channel.getUsersOnline() ]});
      user.removeChannel(channel);
      this.raise_<void>('onChannelDeleted', { channel, targetUsers: [ user ] });
      await this.channelsService_.removeChannelUser(channel.id, user.id);
    }
  }
}
