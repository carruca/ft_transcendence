import {
  UserModel as User,
  ChannelModel as Channel,
  ChannelTopicModel as ChannelTopic,
  ConversationModel as Conversation,
  ChallengeModel as Challenge,
  EventModel as Event,
  DataLoaderModel as DataLoader,
  Response,
} from '../model';

import {
  UserPayload,
  ChannelPayload,
  ChannelTopicPayload,
  ChallengePayload,
  ConversationPayload,
} from '../interface';

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
  UserSiteRoleEnum,
  EventTypeEnum,
} from '../enum';

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

  //TODO Esto es realmente necesario? si ya tengo el usuario creado usando userFromDB....
  public addUserDB(userDB: UserDB ): User {
    let sourceUser = this.userFromDB_(userDB);

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

    console.log(channelDB);
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

  public async topicChannelUUID(sourceUser: User, channelUUID: string, value: string): Promise<Response> {
    const channel = this.getChannelByUUID(channelUUID);
    const channelTopicPayload: ChannelTopicPayload = {
      user: sourceUser,
      value: value,
    };

    if (!channel) return Response.ChannelNotExists();
    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();
    if (!channel.hasPrivileges(sourceUser)) return Response.InsufficientPrivileges();
    if (channel.topic?.value === value) return Response.Success();

    const channelTopic = new ChannelTopic(channelTopicPayload);

    if (this.raise_<boolean>('onChannelTopicChanging', { channel, channelTopic }).includes(true))
      return Response.Denied();

    this.raise_<void>('onChannelTopicChanged', { channel, channelTopic });
    channel.topic = channelTopic;
    return Response.Success();
  }

  public async connectUser(sourceUser: User): Promise<Response> {
    if (sourceUser === undefined) return Response.UserNotExists();
    if (sourceUser.isSiteDisabled) return Response.Denied();
    if (sourceUser.isSiteBanned) return Response.Denied();

    /*
    if (this.raise_<boolean>('onUserConnecting', { sourceUser }).includes(true))
      return Response.Denied();
    */

    //TODO falta la gestión de más de una conexión simultánea con el mismo usuario
    this.usersBySocket_.set(sourceUser.socket, sourceUser);
    this.updateUserStatus(sourceUser, UserStatusEnum.ONLINE);
    //console.log(sourceUser);
    this.raise_<void>('onUserConnected', { sourceUser });
    return Response.Success();
  }

  public async disconnectUser(sourceUser: User): Promise<Response> {
    this.updateUserStatus(sourceUser, UserStatusEnum.OFFLINE);
    this.raise_<void>('onUserDisconnect', { sourceUser });
    this.usersBySocket_.delete(sourceUser.socket);
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

    if (!conversationData.uuid) {
      this.logger_.debug("No UUID provided for new conversation. Generating one...");
      conversationData.uuid = uuidv4();
    }
    conversation = new Conversation(conversationData);
    this.conversationsByUUID_.set(conversation.uuid, conversation);
    this.conversationsByUsers_.set(conversation.user1, conversation.user2, conversation);
    this.raise_<void>('onConversationCreated', { conversation });
    return Response.Success();
  }

  public async deleteConversation(conversation?: Conversation | string): Promise<Response> {
    if (typeof conversation === "string")
      conversation = this.getConversationByUUID(conversation);
    if (!conversation) return Response.Success();
    this.conversationsByUUID_.delete(conversation.uuid);
    this.conversationsByUsers_.delete(conversation.user1, conversation.user2);
    this.raise_<void>('onConversationDeleted', { conversation });
    return Response.Success();
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

  public async createChannelName(sourceUser: User, channelName: string, password?: string): Promise<Response> {
    let channel = this.getChannelByName(channelName);

    if (!checkChannelName(channelName)) return Response.BadChannelName();
    if (channel) return Response.ChannelExists();

    const channelDB = await this.channelsService_.create({
      name: channelName,
      ownerId: sourceUser.uuid,
      password: password,
    });
    channel = this.addChannelDB(channelDB);
    channel.addGenericEvent(EventTypeEnum.CREATE, sourceUser);
    this.raise_<void>('onChannelCreated', { channel, sourceUser });
    //TODO enviar a los que están en el panel de admin.
    return Response.Success();
  }

  public async deleteChannelUUID(user: User, channelUUID: string): Promise<Response> {
    const channel = this.getChannelByUUID(channelUUID);

    if (!channel) return Response.ChannelNotExists();
    if (!channel.isOwner(user)) return Response.InsufficientPrivileges();

    this.raise_<void>('onChannelDeleted', { channel, user });
    this.destroyChannel_(channel);
    //this.destroyChannel_(channel);

    return Response.Success();
  }

  public async joinChannelUUID(sourceUser: User, channelUUID: string, password?: string): Promise<Response> {
    let channel = this.getChannelByUUID(channelUUID);

    if (!channel) return Response.ChannelNotExists();
    if (channel.password !== password) return Response.InvalidPassword();
    if (channel.hasBanned(sourceUser)) return Response.BannedFromChannel();
    if (channel.hasUser(sourceUser)) return Response.AlreadyInChannel();

    if (this.raise_<boolean>('onUserJoining', { channel, sourceUser }).includes(true))
      return Response.Denied();

    await this.addUserToChannel_(sourceUser, channel);
    channel.addGenericEvent(EventTypeEnum.JOIN, sourceUser);
    //this.raise_<void>('onUserJoined', { channel, sourceUser });
    return Response.Success();
  }

  public async partChannelUUID(sourceUser: User, channelUUID: string): Promise<Response> {
    let channel = this.getChannelByUUID(channelUUID);

    if (!channel) return Response.ChannelNotExists();
    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();

    this.raise_<void>('onUserParted', { channel, sourceUser });
    //TODO await this.delUserFromChannel_(sourceUser, channel);
    if (channel.isEmpty)
      this.destroyChannel_(channel);
    return Response.Success();
  }

  private destroyChannel_(channel: Channel): void {
    this.raise_<void>('onChannelDestroyed', { channel });
    this.channelsByUUID_.delete(channel.uuid);
    this.channelsByName_.delete(channel.name);

    for (const user of channel.getUsers()) {
      user.removeChannel(channel);
    }
  }

  public async summarizeChannels(sourceUser: User): Promise<Response> {
    let channelsSummaryDTO: ChannelSummaryDTO[] = [];

    for (const channel of this.getChannels()) {
      channelsSummaryDTO.push(new ChannelSummaryDTO(channel));
    }

    this.raise_<void>('onUserChannelsSummarized', { sourceUser, channelsSummaryDTO })
    return Response.Success();
  }

  public async observeUserUUID(sourceUser: User, targetUserUUID: string): Promise<Response> {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return Response.UserNotExists();
    if (sourceUser.status === UserStatusEnum.IN_GAME) return Response.YoureInGame();
    if (targetUser.status !== UserStatusEnum.IN_GAME) return Response.UserInGame();

    //TODO advertir al resto de usuarios el cambio de estado.
    this.updateUserStatus(sourceUser, UserStatusEnum.IN_GAME);
    this.raise_<void>('onUserUserObserved', { sourceUser, targetUser })
    return Response.Success();
  }

  public async closeChannelUUID(sourceUser: User, channelUUID: string, message: string): Promise<Response> {
    const channel = this.getChannelByUUID(channelUUID);

    if (!channel) return Response.ChannelNotExists();
    if (!channel.hasPrivileges(sourceUser) && !sourceUser.hasPrivileges()) return Response.InsufficientPrivileges();

    this.raise_<void>("onChannelClosed", { channel, sourceUser });
    //TODO: hacer que los usuarios dejen de tener ese canal y eliminar el canal
    //DONE: Creo que ya está hecho, verificar esta parte:
    this.cleanChannel_(channel);
    this.destroyChannel_(channel);
    return Response.Success();
  }

  public async passwordChannelUUID(sourceUser: User, channelUUID: string, newPassword: string): Promise<Response> {
    const channel = this.getChannelByUUID(channelUUID);

    //TODO: newPassword se debería verificar los caracteres?
    if (!channel)
      return Response.ChannelNotExists();
    if (!channel.hasPrivileges(sourceUser))
      return Response.InsufficientPrivileges();
    if (channel.password === newPassword) return Response.Success();

    if (this.raise_<boolean>("onChannelPasswordChanging", { channel, sourceUser, newPassword }).includes(true))
      return Response.Denied();
    this.raise_<void>("onChannelPasswordChanged", { channel, sourceUser, newPassword });
    channel.password = newPassword;
    channel.addGenericEvent(EventTypeEnum.PASSWORD, sourceUser);
    return Response.Success();
  }

  public async kickUserFromChannelUUID(sourceUser: User, channelUUID: string, targetUserUUID: string, message?: string): Promise<Response> {
    const channel = this.getChannelByUUID(channelUUID);
    const targetUser = this.getUserByUUID(targetUserUUID);

    //TODO: En un UUID no se verifica los nombres
    //if (!checkChannelName(channelName)) return Response.BadChannelName);
    if (!channel) return Response.ChannelNotExists();
    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();
    if (!channel.hasPrivileges(sourceUser)) return Response.InsufficientPrivileges();
    if (!targetUser) return Response.UserNotExists();
    if (!channel.hasUser(targetUser)) return Response.NotInChannel();
    if (channel.ownerUser === targetUser) return Response.InsufficientPrivileges();

    if (this.raise_<boolean>("onUserKicking", {channel, sourceUser, targetUser}).includes(true))
      return Response.Denied();

    this.raise_<void>("onUserKicked", {channel, sourceUser, targetUser, message});
    channel.removeUser(targetUser);
    targetUser.removeChannel(channel);
    channel.addKickEvent(sourceUser, targetUser, message);
    if (channel.isEmpty)
      this.destroyChannel_(channel);
    return Response.Success();
  }

  public async banUserFromChannelUUID(sourceUser: User, channelUUID: string, targetUserUUID: string): Promise<Response> {
    const channel = this.getChannelByUUID(channelUUID);
    const targetUser = this.getUserByUUID(targetUserUUID);

    //TODO: En un UUID no se verifica los nombres
    //if (!this.checkChannelName_(channelName)) return this.chatMessage(ChatReturnCodeEnum.BadChannelName);
    if (!channel) return Response.ChannelNotExists();
    if (!targetUser) return Response.UserNotExists();
    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();
    if (!channel.hasPrivileges(sourceUser)) return Response.InsufficientPrivileges();
    if (!channel.hasUser(targetUser)) return Response.NotInChannel();
    if (channel.ownerUser === targetUser) return Response.InsufficientPrivileges();
    if (channel.hasBanned(targetUser)) return Response.Success();

    if (this.raise_<boolean>("onUserBanning", { channel, sourceUser, targetUser }).includes(true))
      return Response.Denied();

    this.raise_<void>("onUserBanned", { channel, sourceUser, targetUser });
    channel.addBan(targetUser);
    channel.removeUser(targetUser);
    channel.addGenericEvent(EventTypeEnum.BAN, targetUser);
    targetUser.removeChannel(channel);
    return Response.Success();
  }

  public async unbanUserFromChannelUUID(sourceUser: User, channelUUID: string, targetUserUUID: string): Promise<Response> {
    const channel = this.getChannelByUUID(channelUUID);
    const targetUser = this.getUserByUUID(targetUserUUID);

    //TODO: En un UUID no se verifica los nombres
    //if (!this.checkChannelName_(channelName)) return this.chatMessage(ChatReturnCodeEnum.BadChannelName);
    if (!channel) return Response.ChannelNotExists();
    if (!targetUser) return Response.UserNotExists();
    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();
    if (!channel.hasPrivileges(sourceUser)) return Response.InsufficientPrivileges();
  //   if (!channel.hasUser(targetUser)) return this.chatMessage(ChatReturnCodeEnum.NotInChannel();
    if (channel.ownerUser === targetUser) return Response.InsufficientPrivileges();
    if (!channel.hasBanned(targetUser)) return Response.Success();

    if (this.raise_<boolean>("onUserUnbanning", { channel, sourceUser, targetUser }).includes(true))
        return Response.Denied();

    channel.addGenericEvent(EventTypeEnum.UNBAN, targetUser);
    this.raise_<void>("onUserUnbanned", { channel, sourceUser, targetUser });
    channel.removeBan(targetUser);
    return Response.Success();
  }

  public async promoteUserInChannelUUID(sourceUser: User, channelUUID: string, targetUserUUID: string): Promise<Response> {
    const channel = this.getChannelByUUID(channelUUID);
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!channel) return Response.ChannelNotExists();
    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();
    if (!channel.hasPrivileges(sourceUser)) return Response.InsufficientPrivileges();
    if (!targetUser) return Response.UserNotExists();
    if (!channel.hasUser(targetUser)) return Response.NotInChannel();
    //if (channel.owner === targetUser) return this.chatMessage(ChatReturnCodeEnum.InsufficientPrivileges();
    if (channel.hasOper(targetUser)) return Response.Success();

    if (this.raise_<boolean>("onUserPromoting", { channel, sourceUser, targetUser }).includes(true))
      return Response.Denied();

    this.raise_<void>("onUserPromoted", { channel, sourceUser, targetUser });
    channel.addOper(targetUser);
    channel.addGenericEvent(EventTypeEnum.PROMOTE, sourceUser, targetUser);
    return Response.Success();
  }

  public async demoteUserInChannelUUID(sourceUser: User, channelUUID: string, targetUserUUID: string): Promise<Response> {
    const channel = this.getChannelByUUID(channelUUID);
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!channel) return Response.ChannelNotExists();
    if (!channel.hasUser(sourceUser)) return Response.NotInChannel();
    if (!channel.hasPrivileges(sourceUser)) return Response.InsufficientPrivileges();
    if (!targetUser) return Response.UserNotExists();
    if (!channel.hasUser(targetUser)) return Response.NotInChannel();
    //if (channel.owner === targetUser) return this.chatMessage(ChatReturnCodeEnum.InsufficientPrivileges();
    if (!channel.hasOper(targetUser)) return Response.Success();

    if (this.raise_<boolean>('onUserDemoting', { channel, sourceUser, targetUser }).includes(true))
      return Response.Denied();

    channel.addGenericEvent(EventTypeEnum.DEMOTE, sourceUser, targetUser);
    this.raise_<void>('onUserDemoted', { channel, sourceUser, targetUser });
    channel.removeOper(targetUser);
    return Response.Success();
  }

  public async requestChallengeUserUUID(sourceUser: User, targetUserUUID: string, gameMode: GameMode): Promise<Response> {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return Response.UserNotExists();
    if (sourceUser === targetUser) return Response.Success();
    if (this.getChallengeByUsers(sourceUser, targetUser)) return Response.PendingChallenge();
    if (sourceUser.hasBlocked(targetUser)) return Response.Success();
    if (targetUser.hasBlocked(sourceUser)) return Response.Success();
    if (sourceUser.status === UserStatusEnum.OFFLINE) return Response.UserNotConnected();
    if (sourceUser.status === UserStatusEnum.IN_GAME) return Response.UserInGame();
    if (sourceUser.status === UserStatusEnum.AWAY) return Response.UserAway();

    if (this.raise_<boolean>('onUserChallengeRequested', { sourceUser, targetUser }).includes(true))
      return Response.Denied();
    this.createChallenge(sourceUser, targetUser);
    this.raise_<void>('onUserChallengeRequest', { sourceUser, targetUser });
    return Response.Success();
  }

  public async acceptChallengeUserUUID(sourceUser: User, targetUserUUID: string): Promise<Response> {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return Response.UserNotExists();
    if (sourceUser === targetUser) return Response.Success();

    const challenge = this.getChallengeByUsers(sourceUser, targetUser);

    if (!challenge) return Response.Success();
    if (challenge.targetUser !== targetUser) return Response.Success();
    if (sourceUser.status === UserStatusEnum.OFFLINE) return Response.UserNotConnected();
    if (sourceUser.status === UserStatusEnum.IN_GAME) return Response.UserInGame();
    if (sourceUser.status === UserStatusEnum.AWAY) return Response.UserAway();

    if (this.raise_<boolean>('onUserChallengeAccepting', { sourceUser, targetUser }).includes(true))
      return Response.Denied();
    this.deleteChallenge(sourceUser, targetUser);
    this.updateUserStatus(targetUser, UserStatusEnum.IN_GAME);
    this.raise_<void>('onUserChallengeAccepted', { sourceUser, targetUser });
    return Response.Success();
  }

  public async rejectChallengeUserUUID(sourceUser: User, targetUserUUID: string): Promise<Response> {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return Response.UserNotExists();
    if (sourceUser === targetUser) return Response.Success();

    const challenge = this.getChallengeByUsers(sourceUser, targetUser);

    if (!challenge) return Response.Success();
    if (challenge.targetUser !== targetUser) return Response.Success();

    if (this.raise_<boolean>('onUserChallengeRejecting', { sourceUser, targetUser }).includes(true))
      return Response.Denied();
    this.deleteChallenge(sourceUser, targetUser);
    this.raise_<void>('onUserChallengeRejected', { sourceUser, targetUser });
    return Response.Success();
  }

  public async blockUserUUID(sourceUser: User, targetUserUUID: string): Promise<Response> {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return Response.UserNotExists();
    if (sourceUser === targetUser) return Response.Success();
    if (sourceUser.hasBlocked(targetUser)) return Response.Success();

    if (this.raise_<boolean>('onUserBlocking', { sourceUser, targetUser }).includes(true))
      return Response.Denied();

    this.raise_<void>('onUserBlocked', { sourceUser, targetUser });
    sourceUser.addBlock(targetUser);
    return Response.Success();
  }

  public async unblockUserUUID(sourceUser: User, targetUserUUID: string): Promise<Response> {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return Response.UserNotExists();
    if (sourceUser === targetUser) return Response.Success();
    if (!sourceUser.hasBlocked(targetUser)) return Response.Success();

    if (this.raise_<boolean>('onUserUnblocking', { sourceUser, targetUser }).includes(true))
      return Response.Denied();

    this.raise_<void>('onUserUnblocked', { sourceUser, targetUser });
    sourceUser.removeBlock(targetUser);
    return Response.Success();
  }

  public async banUserUUID(sourceUser: User, targetUserUUID: string): Promise<Response> {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return Response.UserNotExists();
    if (!targetUser.isSiteBanned) return Response.Success();
    if (!sourceUser.hasPrivileges) return Response.Denied();
    if (sourceUser.is(targetUser)) return Response.Success();
    if (targetUser.isSiteOwner) return Response.Denied();

    if (this.raise_<boolean>('onUserBanning', { sourceUser, targetUser }).includes(true))
      return Response.Denied();

    this.raise_<void>('onUserBanned', { sourceUser, targetUser });
    sourceUser.siteBanned = true;
    return Response.Success();
  }

  public async unbanUserUUID(sourceUser: User, targetUserUUID: string): Promise<Response> {
    const targetUser = this.getUserByUUID(targetUserUUID);

    if (!targetUser) return Response.UserNotExists();
    if (targetUser.isSiteBanned) return Response.Success();
    if (!sourceUser.hasPrivileges) return Response.Denied();

    if (this.raise_<boolean>('onUserUnbanning', { sourceUser, targetUser }).includes(true))
      return Response.Denied();

    this.raise_<void>('onUserUnbanned', { sourceUser, targetUser });
    sourceUser.siteBanned = false;
    return Response.Success();
  }

  public async messageChannelUUID(sourceUser: User, targetChannelUUID: string, message: string): Promise<Response> {
    const targetChannel = this.getChannelByUUID(targetChannelUUID);
    const event = Event.message(sourceUser, message);
    const payload = {
      senderUser: sourceUser,
      targetChannel: targetChannel,
      event: event
    }

    if (!targetChannel) return Response.ChannelNotExists();
    if (!targetChannel.hasUser(sourceUser)) return Response.NotInChannel();
    if (targetChannel.hasMuted(sourceUser)) return Response.CannotSendToChannel();
    if (targetChannel.hasBanned(sourceUser)) return Response.CannotSendToChannel();

    if (this.raise_<boolean>("onChannelMessageSending", payload).includes(true))
      return Response.Denied();

    targetChannel.addEvent(event);
    this.raise_<void>("onChannelMessageSended", payload);
    return Response.Success();
  }

  public async messageConversationUUID(sourceUser: User, targetConversationUUID: string, message: string): Promise<Response> {
    const targetConversation = this.getConversationByUUID(targetConversationUUID);
    const event = Event.message(sourceUser, message);
    let payload = {
      senderUser: sourceUser,
      targetConversation: targetConversation,
      event: event,
    }

    if (!targetConversation) return Response.UserNotExists();
    if (targetConversation.hasBlocked(sourceUser)) return Response.Success();

    if (this.raise_<boolean>("onUserMessageSending", payload).includes(true))
      return Response.Denied();
    targetConversation.addEvent(event);
    this.raise_<void>("onUserMessageSended", payload);
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
    user.status = updatedStatus;
    this.logger_.log(`${user.name} status changed to ${['Offline', 'Online', 'In game', 'Away'][updatedStatus]}`);
    //throw new NotImplementedError("updateUserStatus: function not implemented yet.");

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

  private userFromDB_(userDB: UserDB): User {
    //console.log("userFromDB_: ", userDB) ;
    if (!userDB.nickname)
      throw new PropertyUndefinedError("userFromDB: nickname is not set");

    return new User({
      intraId: userDB.intraId,
      uuid: userDB.id,
      name: userDB.nickname,
      siteRole: userDB.mode as number,
    });
  }

  private channelFromDB_(channelDB: ChannelDB): Channel {
    //console.log("channelFromDB_: ", channelDB) ;
    const ownerUser = this.getUserByUUID(channelDB.ownerId);
    let channelTopicPayload: ChannelTopicPayload | undefined;

    if (!ownerUser)
      throw new UserNotFoundError("channelFromDB: ownerId user not found.");

    if (channelDB.topicUser) {
      const topicUser = this.getUserByUUID(channelDB.topicUser);

      if (topicUser) {
        channelTopicPayload = {
          user: topicUser,
          establishedDate: channelDB.topicSetDate!,
          value: channelDB.topic!,
        };
      } else {
        throw new UserNotFoundError("channelFromDB: topicUserId user not found.");
      }
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

    console.log("addChannelUserFromDB", channelUserDB);
    if (!user) {
      throw new UserNotFoundError("addChannelUserFromDB_: userUUID user not found in memory");
    }
    channel.addUser(user);
    user.addChannel(channel);
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
}
