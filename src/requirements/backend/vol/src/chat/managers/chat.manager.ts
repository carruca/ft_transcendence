import {
  UserModel as User,
  ChannelModel as Channel,
  ConversationModel as Conversation,
  EventModel as Event,
  DataLoaderModel as DataLoader,
} from '../models';

import {
  UserData, 
  ChannelData,
  ChannelTopic,
  ChallengeData,
  ConversationData,
} from '../interfaces';

import {
  UserDTO,
  ChannelDTO,
  ChannelTopicDTO,
  ConversationDTO,
} from '../dto';

import {
  UserStatus,
  //UserChannelRole,
  //UserSiteRole,
  EventType,
} from '../enums';

import {
  ReturnCode,
  ReturnMessage,
  ReturnMessages,
} from '../return-messages';

import { UserNotFoundError, UserNoSocketError } from '../errors';

import { ChannelsService } from '../../channels/channels.service';
import { UsersService } from '../../users/users.service';

import { CreateChannelDto } from '../../channels/dto/create-channel.dto';
import { CreateChannelUserDto } from '../../channels/dto/create-channel-user.dto';

import {
  MultiMap,
  BidirectionalMap,
  checkChannelName,
} from '../utils';

import {
  Mode as GameMode,
} from '../../game/game.interface';

import { User as UserDB } from '../../users/entities/user.entity';
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
  private challengesByUsers_ = new BidirectionalMap<User, ChallengeData>();
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

  public getChallengeByUsers(user1: User, user2: User): ChallengeData | undefined {
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

  public addUserDB(userInfo: UserDB ): User {
    let sourceUser = new User(userInfo);

    if (this.usersByUUID_.has(sourceUser.uuid))
      return this.getUserByUUID(sourceUser.uuid)!;

    this.usersByID_.set(sourceUser.intraId, sourceUser);
    this.usersByUUID_.set(sourceUser.uuid, sourceUser);
    this.usersByName_.set(sourceUser.name, sourceUser);
    //this.usersBySocket_.set(sourceUser.socket, sourceUser);

    //this.raise_<void>('onUserAdded', { sourceUser }); 
    return sourceUser;
  }

  public changeNickUserIntraId(intraId: number, nickname: string) {
    const sourceUser = this.getUserByID(intraId);

    if (sourceUser) {
      this.raise_<void>('onUserNickChanged', { sourceUser, nickname });
      sourceUser.name = nickname;
    }
  }

  public addChannelDB(channelDB: ChannelDB ): Channel {
    const ownerUser = this.getUserByUUID(channelDB.owner);
    let channelTopic: ChannelTopic | undefined;

    if (!ownerUser)
      throw new UserNotFoundError("channelDB contains a non valid owner uuid"); 

    if (channelDB.topicUser) {
      const topicUser = this.getUserByUUID(channelDB.topicUser);

      if (!topicUser)
        throw new UserNotFoundError("channelDB contains a non valid topic.user uuid");

      channelTopic = {
        user: topicUser,
        setDate: channelDB.topicSetDate!,
        value: channelDB.topic!,
      };
    }

    const channelData: ChannelData = {
      uuid: channelDB.id,
      name: channelDB.name,
      owner: ownerUser,
      createdDate: channelDB.createdDate,
      topic: channelTopic,
      password: channelDB.password,
    };

    const channel = new Channel(channelData);
    this.addChannel_(channel);
    return channel;
  }

  private addChannel_(channel: Channel) {
    this.channelsByName_.set(channel.name, channel);
    this.channelsByUUID_.set(channel.uuid, channel);
  }

  public renameUser(userUUID: string, nickname: string) {

  }

  /*
  **  methods
  */

  public topicChannelUUID(sourceUser: User, channelUUID: string, value: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);
    const topic: ChannelTopic = {
      user: sourceUser,
      setDate: new Date(),
      value: value,
    };

    if (!channel) return this.message_(ReturnCode.ChannelNotExists);
    if (!channel.hasUser(sourceUser)) return this.message_(ReturnCode.NotInChannel);
    if (!channel.hasPrivileges(sourceUser)) return this.message_(ReturnCode.InsufficientPrivileges);
    if (channel.topic?.value === value) return this.message_(ReturnCode.Allowed);

    if (this.raise_<boolean>('onChannelTopicChanging', { channel, topic }).includes(true))
      return this.message_(ReturnCode.Denied);

    this.raise_<void>('onChannelTopicChanged', { channel, topic });
    channel.topic = topic;
    return this.message_(ReturnCode.Allowed);
  }

  public connectUser(sourceUser: User): ReturnMessage {
    if (sourceUser === undefined) return this.message_(ReturnCode.UserNotExists);
    if (sourceUser.isDisabled()) return this.message_(ReturnCode.Denied);
    if (sourceUser.isBanned()) return this.message_(ReturnCode.Denied);

    /*
    if (this.raise_<boolean>('onUserConnecting', { sourceUser }).includes(true)) 
      return this.message_(ReturnCode.Denied);
    */

    this.usersBySocket_.set(sourceUser.socket, sourceUser);
    sourceUser.status = UserStatus.ONLINE;
    this.raise_<void>('onUserConnected', { sourceUser });
    this.logger_.debug(`nick ${sourceUser.name} has marked ONLINE`);
    return this.message_(ReturnCode.Allowed);
  }

  public disconnectUser(sourceUser: User): ReturnMessage {
    sourceUser.status = UserStatus.OFFLINE;
    this.raise_<void>('onUserDisconnect', { sourceUser });
    this.usersBySocket_.delete(sourceUser.socket);
    this.logger_.debug(`nick ${sourceUser.name} has marked OFFLINE`);
    return this.message_(ReturnCode.Allowed);
  }

  public createChallenge(user1: User, user2: User) {
    this.challengesByUsers_.set(user1, user2, { sourceUser: user1, targetUser: user2 });
  }

  public deleteChallenge(user1: User, user2: User) {
    this.challengesByUsers_.delete(user1, user2);
  }

  public createConversation(user1: User, user2: User): ReturnMessage {
    let conversation: Conversation;
    const conversationData: ConversationData = {
      user1: user1,
      user2: user2,
    };

    if (user1.is(user2))
      return this.message_(ReturnCode.NothingHappened);

    if (this.raise_<boolean>('onConversationCreating', { conversationData }).includes(true))
      return this.message_(ReturnCode.Denied);

    if (!conversationData.uuid) {
      this.logger_.debug("No UUID provided for new conversation. Generating one...");
      conversationData.uuid = uuidv4();
    }
    conversation = new Conversation(conversationData);
    this.conversationsByUUID_.set(conversation.uuid, conversation);
    this.conversationsByUsers_.set(conversation.user1, conversation.user2, conversation);
    this.raise_<void>('onConversationCreated', { conversation });
    return this.message_(ReturnCode.Allowed, { conversation });
  }

  public deleteConversation(conversation?: Conversation | string): ReturnMessage {
    if (typeof conversation === "string")
      conversation = this.getConversationByUUID(conversation);
    if (!conversation) return this.message_(ReturnCode.NothingHappened);
    this.conversationsByUUID_.delete(conversation.uuid);
    this.conversationsByUsers_.delete(conversation.user1, conversation.user2);
    this.raise_<void>('onConversationDeleted', { conversation });
    return this.message_(ReturnCode.Allowed);
  }

  private async addUserToChannel_(user: User, channel: Channel) {
    const createChannelUserDto: CreateChannelUserDto = {
      channelId: channel.uuid,
      userId: user.intraId,
      admin: false,
    };

    channel.addUser(user);
    user.addChannel(channel);
    await this.channelsService_.createChannelUser(createChannelUserDto);
  }

  private async removeUserFromChannel_(user: User, channel: Channel) {
    channel.removeUser(user);
    user.removeChannel(channel);
    await this.channelsService_.removeChannelUser(channel.uuid, +user.uuid); 
  }

  public async createChannelName(sourceUser: User, channelName: string, password?: string): Promise<ReturnMessage> {
    let channel = this.getChannelByName(channelName);

    if (!checkChannelName(channelName)) return this.message_(ReturnCode.BadChannelName);
    if (channel) return this.message_(ReturnCode.ChannelExists);

    const createChannelDto: CreateChannelDto = {
      name: channelName,
      owner: sourceUser.uuid,
      password: password,
    };

    const channelDB = await this.channelsService_.create(createChannelDto);
    channel = this.addChannelDB(channelDB);
    await this.addUserToChannel_(sourceUser, channel);
    channel.addGenericEvent(EventType.CREATE, sourceUser);
    this.raise_<void>('onChannelCreated', { channel, sourceUser });
    return this.message_(ReturnCode.Allowed, { channel: new ChannelDTO(channel) });
  }

  public async deleteChannelUUID(user: User, channelUUID: string): Promise<ReturnMessage> {
    const channel = this.getChannelByUUID(channelUUID);

    if (!channel) return this.message_(ReturnCode.ChannelNotExists);
    if (!channel.isOwner(user)) return this.message_(ReturnCode.InsufficientPrivileges);

    this.destroyChannel_(channel);

    //this.raise_<void>('onChannelDeleted', { channel, user });
    //this.destroyChannel_(channel);

    return this.message_(ReturnCode.Allowed);
  }

  public async joinChannelUUID(sourceUser: User, channelUUID: string, password?: string): Promise<ReturnMessage> {
    let channel = this.getChannelByUUID(channelUUID);

    if (!channel) return this.message_(ReturnCode.ChannelNotExists);
    if (channel.hasUser(sourceUser)) return this.message_(ReturnCode.AlreadyInChannel);
    if (channel.hasBanned(sourceUser)) return this.message_(ReturnCode.BannedFromChannel);
    if (channel.password !== password) return this.message_(ReturnCode.InvalidPassword);

    if (this.raise_<boolean>('onUserJoining', { channel, sourceUser }).includes(true))
      return this.message_(ReturnCode.Denied);

    await this.addUserToChannel_(sourceUser, channel);
    channel.addGenericEvent(EventType.JOIN, sourceUser);
    this.raise_<void>('onUserJoined', { channel, sourceUser });
    return this.message_(ReturnCode.Allowed, { channel });
  }

  public partChannelUUID(user: User, channelUUID: string): ReturnMessage {
    let channel = this.getChannelByUUID(channelUUID);

    if (!channel) return this.message_(ReturnCode.ChannelNotExists);
    if (!channel.hasUser(user)) return this.message_(ReturnCode.NotInChannel);

    this.raise_<void>('onUserParted', { channel, user });
    if (channel.isEmpty)
      this.destroyChannel_(channel);
    return this.message_(ReturnCode.Allowed);
  }

  private destroyChannel_(channel: Channel): void {
    this.raise_<void>('onChannelDestroyed', { channel });
    this.channelsByUUID_.delete(channel.uuid);
    this.channelsByName_.delete(channel.name);

    channel.getUsers().forEach(user => {
      user.removeChannel(channel);
    });
  }
  
  public listChannels(): ReturnMessage {
    let channelList: ChannelDTO[] = [];

    for (const channel of this.getChannels()) {
      channelList.push(channel.getDTO());
    }
    return this.message_(ReturnCode.Allowed, [ channelList ]);
  }

  public forceCloseChannelUUID(sourceUser: User, channelUUID: string, message: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);


    //TODO: En un UUID no se verifica los nombres
    //if (!checkChannelName(channelName)) return this.message_(ReturnCode.BadChannelName);
    if (!channel) return this.message_(ReturnCode.ChannelNotExists);
    if (!channel.hasPrivileges(sourceUser) && !sourceUser.hasPrivileges()) return this.message_(ReturnCode.InsufficientPrivileges);

    if (this.raise_<boolean>("onChannelForceClosing", { channel, sourceUser }).includes(true))
      return this.message_(ReturnCode.Denied);

    this.raise_<void>("onChannelForceClosed", { channel, sourceUser });
    //TODO: hacer que los usuarios dejen de tener ese canal y eliminar el canal
    //DONE: Creo que ya está hecho, verificar esta parte:
    this.cleanChannel_(channel);
    this.destroyChannel_(channel);
    return this.message_(ReturnCode.Allowed);
  }

  public passwordChannelUUID(sourceUser: User, channelUUID: string, newPassword: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);

    //TODO: En un UUID no se verifica los nombres
    //if (!checkChannelName(channelName)) return this.message_(ReturnCode.BadChannelName);
    //
    //TODO: newPassword se debería verificar los caracteres?
    if (!channel)
      return this.message_(ReturnCode.ChannelNotExists);
    if (!channel.hasPrivileges(sourceUser))
      return this.message_(ReturnCode.InsufficientPrivileges);
    if (channel.password === newPassword) return this.message_(ReturnCode.NothingHappened);

    if (this.raise_<boolean>("onChannelPasswordChanging", { channel, sourceUser, newPassword }).includes(true))
      return this.message_(ReturnCode.Denied);
    this.raise_<void>("onChannelPasswordChanged", { channel, sourceUser, newPassword });
    channel.password = newPassword;
    channel.addGenericEvent(EventType.PASSWORD, sourceUser);
    return this.message_(ReturnCode.Allowed);
  }

  public kickUserFromChannelUUID(sourceUser: User, channelUUID: string, targetUserUUID: string, message?: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);
    const targetUser = this.getUserByUUID(targetUserUUID);

    //TODO: En un UUID no se verifica los nombres
    //if (!checkChannelName(channelName)) return this.message_(ReturnCode.BadChannelName);
    if (!channel) return this.message_(ReturnCode.ChannelNotExists);
    if (!channel.hasUser(sourceUser)) return this.message_(ReturnCode.NotInChannel);
    if (!channel.hasPrivileges(sourceUser)) return this.message_(ReturnCode.InsufficientPrivileges);
    if (!targetUser) return this.message_(ReturnCode.UserNotExists);
    if (!channel.hasUser(targetUser)) return this.message_(ReturnCode.NotInChannel);
    if (channel.owner === targetUser) return this.message_(ReturnCode.InsufficientPrivileges);

    if (this.raise_<boolean>("onUserKicking", {channel, sourceUser, targetUser}).includes(true))
      return this.message_(ReturnCode.Denied);

    this.raise_<void>("onUserKicked", {channel, sourceUser, targetUser, message});
    channel.removeUser(targetUser);
    targetUser.removeChannel(channel);
    channel.addKickEvent(sourceUser, targetUser, message);
    if (channel.isEmpty)
      this.destroyChannel_(channel);
    return this.message_(ReturnCode.Allowed);
  }

  public banUserFromChannelUUID(sourceUser: User, channelUUID: string, targetUserUUID: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);
    const targetUser = this.getUserByUUID(targetUserUUID);

    //TODO: En un UUID no se verifica los nombres
    //if (!this.checkChannelName_(channelName)) return this.chatMessage(ChatReturnCode.BadChannelName);
    if (!channel) return this.message_(ReturnCode.ChannelNotExists);
    if (!targetUser) return this.message_(ReturnCode.UserNotExists);
    if (!channel.hasUser(sourceUser)) return this.message_(ReturnCode.NotInChannel);
    if (!channel.hasPrivileges(sourceUser)) return this.message_(ReturnCode.InsufficientPrivileges);
    if (!channel.hasUser(targetUser)) return this.message_(ReturnCode.NotInChannel);
    if (channel.owner === targetUser) return this.message_(ReturnCode.InsufficientPrivileges);
    if (channel.hasBanned(targetUser)) return this.message_(ReturnCode.Allowed);

    if (this.raise_<boolean>("onUserBanning", { channel, sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCode.Denied);

    this.raise_<void>("onUserBanned", { channel, sourceUser, targetUser });
    channel.addBan(targetUser);
    channel.removeUser(targetUser);
    channel.addGenericEvent(EventType.BAN, targetUser);
    targetUser.removeChannel(channel);
    return this.message_(ReturnCode.Allowed);
  }

  public unbanUserFromChannelUUID(sourceUser: User, channelUUID: string, targetUserUUID: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);
    const targetUser = this.getUserByUUID(targetUserUUID);

    //TODO: En un UUID no se verifica los nombres
    //if (!this.checkChannelName_(channelName)) return this.chatMessage(ChatReturnCode.BadChannelName);
    if (!channel) return this.message_(ReturnCode.ChannelNotExists);
    if (!targetUser) return this.message_(ReturnCode.UserNotExists);
    if (!channel.hasUser(sourceUser)) return this.message_(ReturnCode.NotInChannel);
    if (!channel.hasPrivileges(sourceUser)) return this.message_(ReturnCode.InsufficientPrivileges);
  //   if (!channel.hasUser(targetUser)) return this.chatMessage(ChatReturnCode.NotInChannel);
    if (channel.owner === targetUser) return this.message_(ReturnCode.InsufficientPrivileges);
    if (!channel.hasBanned(targetUser)) return this.message_(ReturnCode.Allowed);

    if (this.raise_<boolean>("onUserUnbanning", { channel, sourceUser, targetUser }).includes(true))
        return this.message_(ReturnCode.Denied);

    channel.addGenericEvent(EventType.UNBAN, targetUser);
    this.raise_<void>("onUserUnbanned", { channel, sourceUser, targetUser });
    channel.removeBan(targetUser);
    return this.message_(ReturnCode.Allowed);
  }

  public promoteUserInChannelUUID(sourceUser: User, channelUUID: string, targetUserUUID: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!channel) return this.message_(ReturnCode.ChannelNotExists);
    if (!channel.hasUser(sourceUser)) return this.message_(ReturnCode.NotInChannel);
    if (!channel.hasPrivileges(sourceUser)) return this.message_(ReturnCode.InsufficientPrivileges);
    if (!targetUser) return this.message_(ReturnCode.UserNotExists);
    if (!channel.hasUser(targetUser)) return this.message_(ReturnCode.NotInChannel);
    //if (channel.owner === targetUser) return this.chatMessage(ChatReturnCode.InsufficientPrivileges);
    if (channel.hasOper(targetUser)) return this.message_(ReturnCode.NothingHappened);

    if (this.raise_<boolean>("onUserPromoting", { channel, sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCode.Denied);

    this.raise_<void>("onUserPromoted", { channel, sourceUser, targetUser });
    channel.addOper(targetUser);
    channel.addGenericEvent(EventType.PROMOTE, sourceUser, targetUser);
    return this.message_(ReturnCode.Allowed);
  }

  public demoteUserInChannelUUID(sourceUser: User, channelUUID: string, targetUserUUID: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!channel) return this.message_(ReturnCode.ChannelNotExists);
    if (!channel.hasUser(sourceUser)) return this.message_(ReturnCode.NotInChannel);
    if (!channel.hasPrivileges(sourceUser)) return this.message_(ReturnCode.InsufficientPrivileges);
    if (!targetUser) return this.message_(ReturnCode.UserNotExists);
    if (!channel.hasUser(targetUser)) return this.message_(ReturnCode.NotInChannel);
    //if (channel.owner === targetUser) return this.chatMessage(ChatReturnCode.InsufficientPrivileges);
    if (!channel.hasOper(targetUser)) return this.message_(ReturnCode.NothingHappened);

    if (this.raise_<boolean>('onUserDemoting', { channel, sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCode.Denied);

    channel.addGenericEvent(EventType.DEMOTE, sourceUser, targetUser);
    this.raise_<void>('onUserDemoted', { channel, sourceUser, targetUser });
    channel.removeOper(targetUser);
    return this.message_(ReturnCode.Allowed);
  }

  public requestChallengeUserUUID(sourceUser: User, targetUserUUID: string, gameMode: GameMode): ReturnMessage {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return this.message_(ReturnCode.UserNotExists);
    if (sourceUser === targetUser) return this.message_(ReturnCode.NothingHappened);
    if (this.getChallengeByUsers(sourceUser, targetUser)) return this.message_(ReturnCode.PendingChallenge);
    if (sourceUser.hasBlocked(targetUser)) return this.message_(ReturnCode.NothingHappened);
    if (targetUser.hasBlocked(sourceUser)) return this.message_(ReturnCode.NothingHappened);
    if (sourceUser.status === UserStatus.OFFLINE) return this.message_(ReturnCode.UserNotConnected);
    if (sourceUser.status === UserStatus.INGAME) return this.message_(ReturnCode.UserInGame);
    if (sourceUser.status === UserStatus.AWAY) return this.message_(ReturnCode.UserAway);

    if (this.raise_<boolean>('onUserChallengeRequested', { sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCode.Denied);
    this.createChallenge(sourceUser, targetUser);
    this.raise_<void>('onUserChallengeRequest', { sourceUser, targetUser });
    return this.message_(ReturnCode.Allowed);
  }

  public acceptChallengeUserUUID(sourceUser: User, targetUserUUID: string): ReturnMessage {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return this.message_(ReturnCode.UserNotExists);
    if (sourceUser === targetUser) return this.message_(ReturnCode.NothingHappened);

    const challenge = this.getChallengeByUsers(sourceUser, targetUser);

    if (!challenge) return this.message_(ReturnCode.NothingHappened);
    if (challenge.targetUser !== targetUser) return this.message_(ReturnCode.NothingHappened);
    if (sourceUser.status === UserStatus.OFFLINE) return this.message_(ReturnCode.UserNotConnected);
    if (sourceUser.status === UserStatus.INGAME) return this.message_(ReturnCode.UserInGame);
    if (sourceUser.status === UserStatus.AWAY) return this.message_(ReturnCode.UserAway);

    if (this.raise_<boolean>('onUserChallengeAccepting', { sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCode.Denied);
    this.deleteChallenge(sourceUser, targetUser);
    this.raise_<void>('onUserChallengeAccepted', { sourceUser, targetUser });
    return this.message_(ReturnCode.Allowed);
  }

  public rejectChallengeUserUUID(sourceUser: User, targetUserUUID: string): ReturnMessage {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return this.message_(ReturnCode.UserNotExists);
    if (sourceUser === targetUser) return this.message_(ReturnCode.NothingHappened);

    const challenge = this.getChallengeByUsers(sourceUser, targetUser);

    if (!challenge) return this.message_(ReturnCode.NothingHappened);
    if (challenge.targetUser !== targetUser) return this.message_(ReturnCode.NothingHappened);

    if (this.raise_<boolean>('onUserChallengeRejecting', { sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCode.Denied);
    this.deleteChallenge(sourceUser, targetUser);
    this.raise_<void>('onUserChallengeRejected', { sourceUser, targetUser });
    return this.message_(ReturnCode.Allowed);
  }

  public blockUserUUID(sourceUser: User, targetUserUUID: string): ReturnMessage {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return this.message_(ReturnCode.UserNotExists);
    if (sourceUser === targetUser) return this.message_(ReturnCode.NothingHappened);
    if (sourceUser.hasBlocked(targetUser)) return this.message_(ReturnCode.NothingHappened);

    if (this.raise_<boolean>('onUserBlocking', { sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCode.Denied);

    this.raise_<void>('onUserBlocked', { sourceUser, targetUser });
    sourceUser.addBlock(targetUser);
    return this.message_(ReturnCode.Allowed);
  }

  public unblockUserUUID(sourceUser: User, targetUserUUID: string): ReturnMessage {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return this.message_(ReturnCode.UserNotExists);
    if (sourceUser === targetUser) return this.message_(ReturnCode.NothingHappened);
    if (!sourceUser.hasBlocked(targetUser)) return this.message_(ReturnCode.NothingHappened);

    if (this.raise_<boolean>('onUserUnblocking', { sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCode.Denied);

    this.raise_<void>('onUserUnblocked', { sourceUser, targetUser });
    sourceUser.removeBlock(targetUser);
    return this.message_(ReturnCode.Allowed);
  }

  public banUserUUID(sourceUser: User, targetUserUUID: string): ReturnMessage {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return this.message_(ReturnCode.UserNotExists);
    if (!targetUser.isBanned()) return this.message_(ReturnCode.NothingHappened);
    if (!sourceUser.hasPrivileges()) return this.message_(ReturnCode.Denied);
    if (sourceUser.is(targetUser)) return this.message_(ReturnCode.NothingHappened);
    if (targetUser.isOwner()) return this.message_(ReturnCode.Denied);

    if (this.raise_<boolean>('onUserBanning', { sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCode.Denied);

    this.raise_<void>('onUserBanned', { sourceUser, targetUser });
    sourceUser.ban();
    return this.message_(ReturnCode.Allowed);
  }

  public unbanUserUUID(sourceUser: User, targetUserUUID: string): ReturnMessage {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return this.message_(ReturnCode.UserNotExists);
    if (targetUser.isBanned()) return this.message_(ReturnCode.NothingHappened);
    if (!sourceUser.hasPrivileges()) return this.message_(ReturnCode.Denied);

    if (this.raise_<boolean>('onUserUnbanning', { sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCode.Denied);

    this.raise_<void>('onUserUnbanned', { sourceUser, targetUser });
    sourceUser.unban();
    return this.message_(ReturnCode.Allowed);
  }

  public messageChannelUUID(sourceUser: User, targetChannelUUID: string, message: string): ReturnMessage {
    const targetChannel = this.getChannelByUUID(targetChannelUUID);
    const event = Event.message(sourceUser, message);
    const payload = {
      senderUser: sourceUser,
      targetChannel: targetChannel,
      event: event
    }

    if (!targetChannel) return this.message_(ReturnCode.ChannelNotExists);
    if (!targetChannel.hasUser(sourceUser)) return this.message_(ReturnCode.NotInChannel);
    if (targetChannel.hasMuted(sourceUser)) return this.message_(ReturnCode.CannotSendToChannel);
    if (targetChannel.hasBanned(sourceUser)) return this.message_(ReturnCode.CannotSendToChannel);

    if (this.raise_<boolean>("onChannelMessageSending", payload).includes(true))
      return this.message_(ReturnCode.Denied);

    targetChannel.addEvent(event);
    this.raise_<void>("onChannelMessageSended", payload);
    return this.message_(ReturnCode.Allowed);
  }

  public messageConversationUUID(sourceUser: User, targetConversationUUID: string, message: string): ReturnMessage {
    const targetConversation = this.getConversationByUUID(targetConversationUUID);
    const event = Event.message(sourceUser, message);
    let payload = {
      senderUser: sourceUser,
      targetConversation: targetConversation,
      event: event,
    }

        if (!targetConversation) return this.message_(ReturnCode.UserNotExists);
        if (targetConversation.hasBlocked(sourceUser)) return this.message_(ReturnCode.NothingHappened);

        if (this.raise_<boolean>("onUserMessageSending", payload).includes(true))
            return this.message_(ReturnCode.Denied);
        targetConversation.addEvent(event);
        this.raise_<void>("onUserMessageSended", payload);
        return this.message_(ReturnCode.Allowed);
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

  private async raisePro_<T>(event: string, ...params: any[]): Promise<T[]> {
    let i = 0;
    const results: T[] = [];
    const callbacks = this.events_.get(event);

    if (callbacks) {
      for (const callback of callbacks) {
        const result = await callback(...params);
        results.push(result as T);
        console.log(`Ejecutando el elemento ${i}`);
        ++i;
      }
    }
    return results;
  }

  private cleanChannel_(channel: Channel): void {
    for (const user of channel.getUsers()) {
      channel.removeUser(user);
      user.removeChannel(channel);
    }
  }

  private message_(code: ReturnCode, data?: {}): ReturnMessage {
    const message = { ...ReturnMessages[code] };

    // console.log("chatMessage", data);
    message.data = data;
    return message;
  }
}
