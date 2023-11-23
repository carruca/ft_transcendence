import {
  UserModel as User,
  ChannelModel as Channel,
  ChannelTopicModel as ChannelTopic,
  ConversationModel as Conversation,
  ChallengeModel as Challenge,
  EventModel as Event,
  DataLoaderModel as DataLoader,
} from '../models';

import {
  UserPayload, 
  ChannelPayload,
  ChannelTopicPayload,
  ChallengePayload,
  ConversationPayload,
} from '../interfaces';

import {
  UserDTO,
  ChannelDTO,
  ChannelTopicDTO,
  ChannelSummaryDTO,
  ConversationDTO,
} from '../dto';

import {
  UserStatusEnum,
  //UserChannelRoleEnum,
  //UserSiteRoleEnum,
  EventTypeEnum,
} from '../enums';

import {
  ReturnCodeEnum,
  ReturnMessage,
  ReturnMessages,
} from '../return-messages';

import {
  UserNotFoundError,
  UserNoSocketError,
  NotImplementedError,
  PropertyUndefinedError
} from '../errors';

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
} from '../utils';

import {
  Mode as GameMode,
} from '../../game/game.interface';

import { User as UserDB, UserPermits } from '../../users/entities/user.entity';
import { Channel as ChannelDB } from '../../channels/entities/channel.entity';

import { Logger, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatManager {
  private logger_ = new Logger(ChatManager.name, {
    timestamp: true,
  });

  private usersByUUID_ = new Map<string, User>();
  private usersByName_ = new Map<string, User>();
  private usersBySocket_ = new Map<Socket, User>();
  private usersByID_ = new Map<number, User>();
  private channelsByName_ = new Map<string, Channel>();
  private channelsByUUID_ = new Map<string, Channel>();
  private conversationsByUUID_ = new Map<string, Conversation>();
  private conversationsByUsers_ = new BidirectionalMap<User, Conversation>();
  //TODO Challenge no anda fino aquí, debería ser el gestor y no la carga de datos
  private challengesByUsers_ = new BidirectionalMap<User, ChallengePayload>();
  private events_ = new MultiMap<string, Function>();

  constructor(
    private channelsService_: ChannelsService,
    private usersService_: UsersService,
  ) {
    this.logger_.log("Instance created");
  }

  /*
  **  properties
  */

  public getUserByID(userIntraID: number): User | undefined {
    let user = this.usersByID_.get(userIntraID);

//    if (!user)
  //    this.raise_<void>('onChatUserGetInfo', { userIntraID, user });
    return user;
  }

  public getUserByUUID(userUUID: string): User | undefined {
    return this.usersByUUID_.get(userUUID);
  }
  
  public getUserByName(userName?: string): User | undefined {
    return this.usersByName_.get(userName!);
  }

  public getUserBySocket(userSocket: Socket): User {
    const user = this.usersBySocket_.get(userSocket);
    if (user === undefined)
      throw new UserNoSocketError("getUserBySocket can't find that socket."); 
    return user;
  }

  public getChannelByName(channelName: string): Channel | undefined {
    return this.channelsByName_.get(channelName);
  }

  public getChannelByUUID(channelUUID: string): Channel | undefined {
    return this.channelsByUUID_.get(channelUUID);
  }

  public getConversationByUUID(conversationUUID: string): Conversation | undefined {
    return this.conversationsByUUID_.get(conversationUUID);
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
    return Array.from(this.channelsByName_.values());
  }

  public getUsers(): User[] {
    return Array.from(this.usersByName_.values());
  }

  public getConversations(): Conversation[] {
    return Array.from(this.conversationsByUUID_.values());
  }

  public userFromDB(db: UserDB): User {
    if (!db.nickname)
      throw new PropertyUndefinedError("userFromDB: nickname is not set"); 

    return new User({
      intraId: db.intraId,
      uuid: db.id,
      name: db.nickname,
      siteRole: db.permits & UserPermits.user | db.permits & UserPermits.owner || db.permits & UserPermits.moderator,
      banned: db.permits == UserPermits.banned,
      disabled: db.permits == UserPermits.disabled,
    });
  }

  //TODO Esto es realmente necesario? si ya tengo el usuario creado usando userFromDB....
  public addUserDB(userDB: UserDB ): User {
    let sourceUser = this.userFromDB(userDB);

    if (this.usersByUUID_.has(sourceUser.uuid))
      return this.getUserByUUID(sourceUser.uuid)!;

    this.usersByID_.set(sourceUser.intraId, sourceUser);
    this.usersByUUID_.set(sourceUser.uuid, sourceUser);
    this.usersByName_.set(sourceUser.name, sourceUser);
    //this.usersBySocket_.set(sourceUser.socket, sourceUser);

    //this.raise_<void>('onUserAdded', { sourceUser }); 
    return sourceUser;
  }

  public changeNickUserUUID(sourceUserUUID: string, nickname: string) {
    const sourceUser = this.getUserByUUID(sourceUserUUID);

    if (sourceUser) {
      this.raise_<void>('onUserNickChanged', { sourceUser, nickname });
      sourceUser.name = nickname;
    }
  }

  public addChannelDB(channelDB: ChannelDB ): Channel {
    const channel = this.channelFromDB_(channelDB);

    this.addChannel_(channel);
    return channel;
  }

  private addChannel_(channel: Channel) {
    this.channelsByName_.set(channel.name, channel);
    this.channelsByUUID_.set(channel.uuid, channel);
  }

  /*
  **  methods
  */

  public topicChannelUUID(sourceUser: User, channelUUID: string, value: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);
    const channelTopicPayload: ChannelTopicPayload = {
      user: sourceUser,
      value: value,
    };

    if (!channel) return this.message_(ReturnCodeEnum.CHANNEL_NOT_EXISTS);
    if (!channel.hasUser(sourceUser)) return this.message_(ReturnCodeEnum.NOT_IN_CHANNEL);
    if (!channel.hasPrivileges(sourceUser)) return this.message_(ReturnCodeEnum.INSUFFICIENT_PRIVILEGES);
    if (channel.topic?.value === value) return this.message_(ReturnCodeEnum.ALLOWED);

    const channelTopic = new ChannelTopic(channelTopicPayload);

    if (this.raise_<boolean>('onChannelTopicChanging', { channel, channelTopic }).includes(true))
      return this.message_(ReturnCodeEnum.DENIED);

    this.raise_<void>('onChannelTopicChanged', { channel, channelTopic });
    channel.topic = channelTopic;
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public async connectUser(sourceUser: User): Promise<ReturnMessage> {
    if (sourceUser === undefined) return this.message_(ReturnCodeEnum.USER_NOT_EXISTS);
    if (sourceUser.isDisabled) return this.message_(ReturnCodeEnum.DENIED);
    if (sourceUser.isBanned) return this.message_(ReturnCodeEnum.DENIED);

    /*
    if (this.raise_<boolean>('onUserConnecting', { sourceUser }).includes(true)) 
      return this.message_(ReturnCodeEnum.DENIED);
    */

    this.usersBySocket_.set(sourceUser.socket, sourceUser);
    sourceUser.status = UserStatusEnum.ONLINE;
    this.raise_<void>('onUserConnected', { sourceUser });
    this.logger_.debug(`nick ${sourceUser.name} has marked ONLINE`);
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public disconnectUser(sourceUser: User): ReturnMessage {
    sourceUser.status = UserStatusEnum.OFFLINE;
    this.raise_<void>('onUserDisconnect', { sourceUser });
    this.usersBySocket_.delete(sourceUser.socket);
    this.logger_.debug(`nick ${sourceUser.name} has marked OFFLINE`);
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public createChallenge(user1: User, user2: User) {
    this.challengesByUsers_.set(user1, user2, { sourceUser: user1, targetUser: user2 });
  }

  public deleteChallenge(user1: User, user2: User) {
    this.challengesByUsers_.delete(user1, user2);
  }

  public createConversation(user1: User, user2: User): ReturnMessage {
    let conversation: Conversation;
    const conversationData: ConversationPayload = {
      user1: user1,
      user2: user2,
    };

    if (user1.is(user2))
      return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);

    if (this.raise_<boolean>('onConversationCreating', { conversationData }).includes(true))
      return this.message_(ReturnCodeEnum.DENIED);

    if (!conversationData.uuid) {
      this.logger_.debug("No UUID provided for new conversation. Generating one...");
      conversationData.uuid = uuidv4();
    }
    conversation = new Conversation(conversationData);
    this.conversationsByUUID_.set(conversation.uuid, conversation);
    this.conversationsByUsers_.set(conversation.user1, conversation.user2, conversation);
    this.raise_<void>('onConversationCreated', { conversation });
    return this.message_(ReturnCodeEnum.ALLOWED, { conversation });
  }

  public deleteConversation(conversation?: Conversation | string): ReturnMessage {
    if (typeof conversation === "string")
      conversation = this.getConversationByUUID(conversation);
    if (!conversation) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);
    this.conversationsByUUID_.delete(conversation.uuid);
    this.conversationsByUsers_.delete(conversation.user1, conversation.user2);
    this.raise_<void>('onConversationDeleted', { conversation });
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  private async addUserToChannel_(user: User, channel: Channel): Promise<void> {
    const createChannelUserDto: CreateChannelUserDto = {
      channelId: channel.uuid,
      userId: user.uuid,
      admin: false,
    };

    channel.addUser(user);
    user.addChannel(channel);
    await this.channelsService_.createChannelUser(createChannelUserDto);
  }

  private async removeUserFromChannel_(user: User, channel: Channel): Promise<void> {
    channel.removeUser(user);
    user.removeChannel(channel);
    await this.channelsService_.removeChannelUser(channel.uuid, user.uuid); 
  }

  public async createChannelName(sourceUser: User, channelName: string, password?: string): Promise<ReturnMessage> {
    let channel = this.getChannelByName(channelName);

    if (!checkChannelName(channelName)) return this.message_(ReturnCodeEnum.BAD_CHANNEL_NAME);
    if (channel) return this.message_(ReturnCodeEnum.CHANNEL_EXISTS);

    const channelDB = await this.channelsService_.create({
      name: channelName,
      ownerId: sourceUser.uuid,
      password: password,
    });
    channel = this.addChannelDB(channelDB);
    channel.addGenericEvent(EventTypeEnum.CREATE, sourceUser);
    this.raise_<void>('onChannelCreated', { channel, sourceUser });
    return this.message_(ReturnCodeEnum.ALLOWED, { channel: new ChannelDTO(channel) });
  }

  public async deleteChannelUUID(user: User, channelUUID: string): Promise<ReturnMessage> {
    const channel = this.getChannelByUUID(channelUUID);

    if (!channel) return this.message_(ReturnCodeEnum.CHANNEL_NOT_EXISTS);
    if (!channel.isOwner(user)) return this.message_(ReturnCodeEnum.INSUFFICIENT_PRIVILEGES);

    this.raise_<void>('onChannelDeleted', { channel, user });
    this.destroyChannel_(channel);
    //this.destroyChannel_(channel);

    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public async joinChannelUUID(sourceUser: User, channelUUID: string, password?: string): Promise<ReturnMessage> {
    let channel = this.getChannelByUUID(channelUUID);

    if (!channel) return this.message_(ReturnCodeEnum.CHANNEL_NOT_EXISTS);
    if (channel.hasUser(sourceUser)) return this.message_(ReturnCodeEnum.ALREADY_IN_CHANNEL);
    if (channel.hasBanned(sourceUser)) return this.message_(ReturnCodeEnum.BANNED_FROM_CHANNEL);
    if (channel.password !== password) return this.message_(ReturnCodeEnum.INVALID_PASSWORD);

    if (this.raise_<boolean>('onUserJoining', { channel, sourceUser }).includes(true))
      return this.message_(ReturnCodeEnum.DENIED);

    await this.addUserToChannel_(sourceUser, channel);
    channel.addGenericEvent(EventTypeEnum.JOIN, sourceUser);
    this.raise_<void>('onUserJoined', { channel, sourceUser });
    return this.message_(ReturnCodeEnum.ALLOWED, { channel });
  }

  public async partChannelUUID(sourceUser: User, channelUUID: string): Promise<ReturnMessage> {
    let channel = this.getChannelByUUID(channelUUID);

    if (!channel) return this.message_(ReturnCodeEnum.CHANNEL_NOT_EXISTS);
    if (!channel.hasUser(sourceUser)) return this.message_(ReturnCodeEnum.NOT_IN_CHANNEL);

    this.raise_<void>('onUserParted', { channel, sourceUser });
    if (channel.isEmpty)
      this.destroyChannel_(channel);
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  private destroyChannel_(channel: Channel): void {
    this.raise_<void>('onChannelDestroyed', { channel });
    this.channelsByUUID_.delete(channel.uuid);
    this.channelsByName_.delete(channel.name);

    for (const user of channel.getUsers()) {
      user.removeChannel(channel);
    }
  }
  
  public async summarizeChannels(sourceUser: User): Promise<ReturnMessage> {
    let channelsSummaryDTO: ChannelSummaryDTO[] = [];

    for (const channel of this.getChannels()) {
      channelsSummaryDTO.push(new ChannelSummaryDTO(channel));
    }

    this.raise_<void>('onUserChannelsSummarized', { sourceUser, channelsSummaryDTO })
    return this.message_(ReturnCodeEnum.ALLOWED, [ channelsSummaryDTO ]);
  }

  public async observeUserUUID(sourceUser: User, targetUserUUID: string): Promise<ReturnMessage> {    
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return this.message_(ReturnCodeEnum.USER_NOT_EXISTS);
    if (sourceUser.status === UserStatusEnum.IN_GAME) return this.message_(ReturnCodeEnum.YOURE_IN_GAME);
    if (targetUser.status !== UserStatusEnum.IN_GAME) return this.message_(ReturnCodeEnum.USER_IN_GAME);

    //TODO advertir al resto de usuarios el cambio de estado.
    this.updateUserStatus(sourceUser, UserStatusEnum.IN_GAME);
    this.raise_<void>('onUserUserObserved', { sourceUser, targetUser })
    return this.message_(ReturnCodeEnum.ALLOWED);
  } 

  public async closeChannelUUID(sourceUser: User, channelUUID: string, message: string): Promise<ReturnMessage> {
    const channel = this.getChannelByUUID(channelUUID);

    if (!channel) return this.message_(ReturnCodeEnum.CHANNEL_NOT_EXISTS);
    if (!channel.hasPrivileges(sourceUser) && !sourceUser.hasPrivileges()) return this.message_(ReturnCodeEnum.INSUFFICIENT_PRIVILEGES);

    this.raise_<void>("onChannelClosed", { channel, sourceUser });
    //TODO: hacer que los usuarios dejen de tener ese canal y eliminar el canal
    //DONE: Creo que ya está hecho, verificar esta parte:
    this.cleanChannel_(channel);
    this.destroyChannel_(channel);
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public passwordChannelUUID(sourceUser: User, channelUUID: string, newPassword: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);

    //TODO: newPassword se debería verificar los caracteres?
    if (!channel)
      return this.message_(ReturnCodeEnum.CHANNEL_NOT_EXISTS);
    if (!channel.hasPrivileges(sourceUser))
      return this.message_(ReturnCodeEnum.INSUFFICIENT_PRIVILEGES);
    if (channel.password === newPassword) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);

    if (this.raise_<boolean>("onChannelPasswordChanging", { channel, sourceUser, newPassword }).includes(true))
      return this.message_(ReturnCodeEnum.DENIED);
    this.raise_<void>("onChannelPasswordChanged", { channel, sourceUser, newPassword });
    channel.password = newPassword;
    channel.addGenericEvent(EventTypeEnum.PASSWORD, sourceUser);
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public kickUserFromChannelUUID(sourceUser: User, channelUUID: string, targetUserUUID: string, message?: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);
    const targetUser = this.getUserByUUID(targetUserUUID);

    //TODO: En un UUID no se verifica los nombres
    //if (!checkChannelName(channelName)) return this.message_(ReturnCodeEnum.BadChannelName);
    if (!channel) return this.message_(ReturnCodeEnum.CHANNEL_NOT_EXISTS);
    if (!channel.hasUser(sourceUser)) return this.message_(ReturnCodeEnum.NOT_IN_CHANNEL);
    if (!channel.hasPrivileges(sourceUser)) return this.message_(ReturnCodeEnum.INSUFFICIENT_PRIVILEGES);
    if (!targetUser) return this.message_(ReturnCodeEnum.USER_NOT_EXISTS);
    if (!channel.hasUser(targetUser)) return this.message_(ReturnCodeEnum.NOT_IN_CHANNEL);
    if (channel.ownerUser === targetUser) return this.message_(ReturnCodeEnum.INSUFFICIENT_PRIVILEGES);

    if (this.raise_<boolean>("onUserKicking", {channel, sourceUser, targetUser}).includes(true))
      return this.message_(ReturnCodeEnum.DENIED);

    this.raise_<void>("onUserKicked", {channel, sourceUser, targetUser, message});
    channel.removeUser(targetUser);
    targetUser.removeChannel(channel);
    channel.addKickEvent(sourceUser, targetUser, message);
    if (channel.isEmpty)
      this.destroyChannel_(channel);
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public banUserFromChannelUUID(sourceUser: User, channelUUID: string, targetUserUUID: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);
    const targetUser = this.getUserByUUID(targetUserUUID);

    //TODO: En un UUID no se verifica los nombres
    //if (!this.checkChannelName_(channelName)) return this.chatMessage(ChatReturnCodeEnum.BadChannelName);
    if (!channel) return this.message_(ReturnCodeEnum.CHANNEL_NOT_EXISTS);
    if (!targetUser) return this.message_(ReturnCodeEnum.USER_NOT_EXISTS);
    if (!channel.hasUser(sourceUser)) return this.message_(ReturnCodeEnum.NOT_IN_CHANNEL);
    if (!channel.hasPrivileges(sourceUser)) return this.message_(ReturnCodeEnum.INSUFFICIENT_PRIVILEGES);
    if (!channel.hasUser(targetUser)) return this.message_(ReturnCodeEnum.NOT_IN_CHANNEL);
    if (channel.ownerUser === targetUser) return this.message_(ReturnCodeEnum.INSUFFICIENT_PRIVILEGES);
    if (channel.hasBanned(targetUser)) return this.message_(ReturnCodeEnum.ALLOWED);

    if (this.raise_<boolean>("onUserBanning", { channel, sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCodeEnum.DENIED);

    this.raise_<void>("onUserBanned", { channel, sourceUser, targetUser });
    channel.addBan(targetUser);
    channel.removeUser(targetUser);
    channel.addGenericEvent(EventTypeEnum.BAN, targetUser);
    targetUser.removeChannel(channel);
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public unbanUserFromChannelUUID(sourceUser: User, channelUUID: string, targetUserUUID: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);
    const targetUser = this.getUserByUUID(targetUserUUID);

    //TODO: En un UUID no se verifica los nombres
    //if (!this.checkChannelName_(channelName)) return this.chatMessage(ChatReturnCodeEnum.BadChannelName);
    if (!channel) return this.message_(ReturnCodeEnum.CHANNEL_NOT_EXISTS);
    if (!targetUser) return this.message_(ReturnCodeEnum.USER_NOT_EXISTS);
    if (!channel.hasUser(sourceUser)) return this.message_(ReturnCodeEnum.NOT_IN_CHANNEL);
    if (!channel.hasPrivileges(sourceUser)) return this.message_(ReturnCodeEnum.INSUFFICIENT_PRIVILEGES);
  //   if (!channel.hasUser(targetUser)) return this.chatMessage(ChatReturnCodeEnum.NOT_IN_CHANNEL);
    if (channel.ownerUser === targetUser) return this.message_(ReturnCodeEnum.INSUFFICIENT_PRIVILEGES);
    if (!channel.hasBanned(targetUser)) return this.message_(ReturnCodeEnum.ALLOWED);

    if (this.raise_<boolean>("onUserUnbanning", { channel, sourceUser, targetUser }).includes(true))
        return this.message_(ReturnCodeEnum.DENIED);

    channel.addGenericEvent(EventTypeEnum.UNBAN, targetUser);
    this.raise_<void>("onUserUnbanned", { channel, sourceUser, targetUser });
    channel.removeBan(targetUser);
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public promoteUserInChannelUUID(sourceUser: User, channelUUID: string, targetUserUUID: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!channel) return this.message_(ReturnCodeEnum.CHANNEL_NOT_EXISTS);
    if (!channel.hasUser(sourceUser)) return this.message_(ReturnCodeEnum.NOT_IN_CHANNEL);
    if (!channel.hasPrivileges(sourceUser)) return this.message_(ReturnCodeEnum.INSUFFICIENT_PRIVILEGES);
    if (!targetUser) return this.message_(ReturnCodeEnum.USER_NOT_EXISTS);
    if (!channel.hasUser(targetUser)) return this.message_(ReturnCodeEnum.NOT_IN_CHANNEL);
    //if (channel.owner === targetUser) return this.chatMessage(ChatReturnCodeEnum.INSUFFICIENT_PRIVILEGES);
    if (channel.hasOper(targetUser)) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);

    if (this.raise_<boolean>("onUserPromoting", { channel, sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCodeEnum.DENIED);

    this.raise_<void>("onUserPromoted", { channel, sourceUser, targetUser });
    channel.addOper(targetUser);
    channel.addGenericEvent(EventTypeEnum.PROMOTE, sourceUser, targetUser);
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public demoteUserInChannelUUID(sourceUser: User, channelUUID: string, targetUserUUID: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!channel) return this.message_(ReturnCodeEnum.CHANNEL_NOT_EXISTS);
    if (!channel.hasUser(sourceUser)) return this.message_(ReturnCodeEnum.NOT_IN_CHANNEL);
    if (!channel.hasPrivileges(sourceUser)) return this.message_(ReturnCodeEnum.INSUFFICIENT_PRIVILEGES);
    if (!targetUser) return this.message_(ReturnCodeEnum.USER_NOT_EXISTS);
    if (!channel.hasUser(targetUser)) return this.message_(ReturnCodeEnum.NOT_IN_CHANNEL);
    //if (channel.owner === targetUser) return this.chatMessage(ChatReturnCodeEnum.INSUFFICIENT_PRIVILEGES);
    if (!channel.hasOper(targetUser)) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);

    if (this.raise_<boolean>('onUserDemoting', { channel, sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCodeEnum.DENIED);

    channel.addGenericEvent(EventTypeEnum.DEMOTE, sourceUser, targetUser);
    this.raise_<void>('onUserDemoted', { channel, sourceUser, targetUser });
    channel.removeOper(targetUser);
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public requestChallengeUserUUID(sourceUser: User, targetUserUUID: string, gameMode: GameMode): ReturnMessage {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return this.message_(ReturnCodeEnum.USER_NOT_EXISTS);
    if (sourceUser === targetUser) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);
    if (this.getChallengeByUsers(sourceUser, targetUser)) return this.message_(ReturnCodeEnum.PENDING_CHALLENGE);
    if (sourceUser.hasBlocked(targetUser)) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);
    if (targetUser.hasBlocked(sourceUser)) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);
    if (sourceUser.status === UserStatusEnum.OFFLINE) return this.message_(ReturnCodeEnum.USER_NOT_CONNECTED);
    if (sourceUser.status === UserStatusEnum.IN_GAME) return this.message_(ReturnCodeEnum.USER_IN_GAME);
    if (sourceUser.status === UserStatusEnum.AWAY) return this.message_(ReturnCodeEnum.USER_AWAY);

    if (this.raise_<boolean>('onUserChallengeRequested', { sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCodeEnum.DENIED);
    this.createChallenge(sourceUser, targetUser);
    this.raise_<void>('onUserChallengeRequest', { sourceUser, targetUser });
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public acceptChallengeUserUUID(sourceUser: User, targetUserUUID: string): ReturnMessage {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return this.message_(ReturnCodeEnum.USER_NOT_EXISTS);
    if (sourceUser === targetUser) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);

    const challenge = this.getChallengeByUsers(sourceUser, targetUser);

    if (!challenge) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);
    if (challenge.targetUser !== targetUser) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);
    if (sourceUser.status === UserStatusEnum.OFFLINE) return this.message_(ReturnCodeEnum.USER_NOT_CONNECTED);
    if (sourceUser.status === UserStatusEnum.IN_GAME) return this.message_(ReturnCodeEnum.USER_IN_GAME);
    if (sourceUser.status === UserStatusEnum.AWAY) return this.message_(ReturnCodeEnum.USER_AWAY);

    if (this.raise_<boolean>('onUserChallengeAccepting', { sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCodeEnum.DENIED);
    this.deleteChallenge(sourceUser, targetUser);
    this.updateUserStatus(sourceUser, UserStatusEnum.IN_GAME);
    this.updateUserStatus(targetUser, UserStatusEnum.IN_GAME);
    this.raise_<void>('onUserChallengeAccepted', { sourceUser, targetUser });
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public rejectChallengeUserUUID(sourceUser: User, targetUserUUID: string): ReturnMessage {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return this.message_(ReturnCodeEnum.USER_NOT_EXISTS);
    if (sourceUser === targetUser) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);

    const challenge = this.getChallengeByUsers(sourceUser, targetUser);

    if (!challenge) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);
    if (challenge.targetUser !== targetUser) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);

    if (this.raise_<boolean>('onUserChallengeRejecting', { sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCodeEnum.DENIED);
    this.deleteChallenge(sourceUser, targetUser);
    this.raise_<void>('onUserChallengeRejected', { sourceUser, targetUser });
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public blockUserUUID(sourceUser: User, targetUserUUID: string): ReturnMessage {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return this.message_(ReturnCodeEnum.USER_NOT_EXISTS);
    if (sourceUser === targetUser) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);
    if (sourceUser.hasBlocked(targetUser)) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);

    if (this.raise_<boolean>('onUserBlocking', { sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCodeEnum.DENIED);

    this.raise_<void>('onUserBlocked', { sourceUser, targetUser });
    sourceUser.addBlock(targetUser);
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public unblockUserUUID(sourceUser: User, targetUserUUID: string): ReturnMessage {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return this.message_(ReturnCodeEnum.USER_NOT_EXISTS);
    if (sourceUser === targetUser) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);
    if (!sourceUser.hasBlocked(targetUser)) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);

    if (this.raise_<boolean>('onUserUnblocking', { sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCodeEnum.DENIED);

    this.raise_<void>('onUserUnblocked', { sourceUser, targetUser });
    sourceUser.removeBlock(targetUser);
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public banUserUUID(sourceUser: User, targetUserUUID: string): ReturnMessage {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return this.message_(ReturnCodeEnum.USER_NOT_EXISTS);
    if (!targetUser.isBanned) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);
    if (!sourceUser.hasPrivileges) return this.message_(ReturnCodeEnum.DENIED);
    if (sourceUser.is(targetUser)) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);
    if (targetUser.isOwner) return this.message_(ReturnCodeEnum.DENIED);

    if (this.raise_<boolean>('onUserBanning', { sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCodeEnum.DENIED);

    this.raise_<void>('onUserBanned', { sourceUser, targetUser });
    sourceUser.ban();
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public unbanUserUUID(sourceUser: User, targetUserUUID: string): ReturnMessage {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return this.message_(ReturnCodeEnum.USER_NOT_EXISTS);
    if (targetUser.isBanned) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);
    if (!sourceUser.hasPrivileges) return this.message_(ReturnCodeEnum.DENIED);

    if (this.raise_<boolean>('onUserUnbanning', { sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCodeEnum.DENIED);

    this.raise_<void>('onUserUnbanned', { sourceUser, targetUser });
    sourceUser.unban();
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public messageChannelUUID(sourceUser: User, targetChannelUUID: string, message: string): ReturnMessage {
    const targetChannel = this.getChannelByUUID(targetChannelUUID);
    const event = Event.message(sourceUser, message);
    const payload = {
      senderUser: sourceUser,
      targetChannel: targetChannel,
      event: event
    }

    if (!targetChannel) return this.message_(ReturnCodeEnum.CHANNEL_NOT_EXISTS);
    if (!targetChannel.hasUser(sourceUser)) return this.message_(ReturnCodeEnum.NOT_IN_CHANNEL);
    if (targetChannel.hasMuted(sourceUser)) return this.message_(ReturnCodeEnum.CANNOT_SEND_TO_CHANNEL);
    if (targetChannel.hasBanned(sourceUser)) return this.message_(ReturnCodeEnum.CANNOT_SEND_TO_CHANNEL);

    if (this.raise_<boolean>("onChannelMessageSending", payload).includes(true))
      return this.message_(ReturnCodeEnum.DENIED);

    targetChannel.addEvent(event);
    this.raise_<void>("onChannelMessageSended", payload);
    return this.message_(ReturnCodeEnum.ALLOWED);
  }

  public messageConversationUUID(sourceUser: User, targetConversationUUID: string, message: string): ReturnMessage {
    const targetConversation = this.getConversationByUUID(targetConversationUUID);
    const event = Event.message(sourceUser, message);
    let payload = {
      senderUser: sourceUser,
      targetConversation: targetConversation,
      event: event,
    }

        if (!targetConversation) return this.message_(ReturnCodeEnum.USER_NOT_EXISTS);
        if (targetConversation.hasBlocked(sourceUser)) return this.message_(ReturnCodeEnum.NOTHING_HAPPENED);

        if (this.raise_<boolean>("onUserMessageSending", payload).includes(true))
            return this.message_(ReturnCodeEnum.DENIED);
        targetConversation.addEvent(event);
        this.raise_<void>("onUserMessageSended", payload);
        return this.message_(ReturnCodeEnum.ALLOWED);
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

  public raiseInitializationEvents(): void {
    const dataLoader = new DataLoader;
    this.logger_.log("Raising initialization events");
    this.raise_<void>('onChatManagerInitialized');
    this.raise_<void>('onChatDataLoad', dataLoader);
    console.log("raiseInit finalizado");
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

  //TODO: A eliminar
  async test() {
    if ((await this.asyncRaise<boolean>('test', "value")).includes(true)) {
      console.log("stop");
    } else {
      console.log("continue");
    }
  }

  private async asyncRaise<T>(event: string, ...params: any[]): Promise<T[]> {
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
    throw new NotImplementedError("updateUserStatus: function not implemented yet.");
  }
  /*
  private channelFromDTO_(dto: ChannelDTO): Channel {
    const owner = this.getUserByUUID(dto.ownerUUID);
    let topic: ChannelTopic | undefined;

    if (!owner)
      throw new UserNotFoundError("channelFromDTO: ownerUUID user not found.");

    if (dto.topic) {
      const topicUser = this.getUserByUUID(dto.topic.userUUID);

      if (!topicUser)
        throw new UserNotFoundError("channelFromDTO: topicUserUUID user not found.");
      topic = {
        user: topicUser,
        setDate: dto.topic.setDate,
        value: dto.topic.value,
      };
    }

    return new Channel(
      dto.uuid,
      dto.name,
      owner,
      dto.createdDate,
      topic,
      dto.password,
    );
  }
  */

  private channelFromDB_(channelDB: ChannelDB): Channel {
    console.log("channelFromDB_: ", channelDB) ;
    const ownerUser = this.getUserByUUID(channelDB.ownerId);
    let channelTopicPayload: ChannelTopicPayload | undefined;

    if (!ownerUser)
      throw new UserNotFoundError("channelFromDB: ownerId user not found.");

    if (channelDB.topicUser) {
      const topicUser = this.getUserByUUID(channelDB.topicUser);
      
      if (!topicUser)
        throw new UserNotFoundError("channelFromDB: topicUserId user not found.");
      channelTopicPayload = {
        user: topicUser,
        establishedDate: channelDB.topicSetDate!,
        value: channelDB.topic!,
      };
    }

    const channel = new Channel({
      uuid: channelDB.id,
      name: channelDB.name,
      ownerUser: ownerUser,
      creationDate: channelDB.createdDate, 
      topic: channelTopicPayload,
      password: channelDB.password,
    });

    if (channelDB.users) {
      channelDB.users.map(channelUserDB => this.addChannelUserFromDB_(channel, channelUserDB));
    }
    return channel;
  }

  private addChannelUserFromDB_(channel: Channel, channelUserDB: ChannelUserDB) {
    const user = this.getUserByUUID(channelUserDB.user.id);

    if (!user) {
      throw new UserNotFoundError("addChannelUserFromDB_: userUUID user not found in memory");
    }
    channel.addUser(user);
    if (channelUserDB.admin) {
      channel.addOper(user);
    }
    if (channelUserDB.banned) {
      channel.addBan(user);
    }
    if (channelUserDB.muted) {
      channel.addMute(user);
    }
 }

  private cleanChannel_(channel: Channel): void {
    for (const user of channel.getUsers()) {
      channel.removeUser(user);
      user.removeChannel(channel);
    }
  }

  private message_(code: ReturnCodeEnum, data?: {}): ReturnMessage {
    const message = { ...ReturnMessages[code] };

    // console.log("chatMessage", data);
    message.data = data;
    return message;
  }
}
