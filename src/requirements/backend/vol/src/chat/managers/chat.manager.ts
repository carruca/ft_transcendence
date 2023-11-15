import {
  UserModel as User,
  ChannelModel as Channel,
  ConversationModel as Conversation,
  EventModel as Event,
  DataLoaderModel as DataLoader,
} from '../models';

import {
  UserData, 
  UserDetails,
  ChannelData,
  ChannelTopic,
  ChannelDetails,
  ConversationData,
} from '../interfaces';

import {
  UserStatus,
  UserChannelRole,
  UserSiteRole,
  EventContentType,
} from '../enums';

import {
  ReturnCode,
  ReturnMessage,
  ReturnMessages,
} from '../return-messages';

import { UserNotFoundError } from '../errors';

import {
  MultiMap,
  BidirectionalMap,
  checkChannelName,
} from '../utils';

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
  private events_ = new MultiMap<string, Function>();

  constructor() {
    this.logger_.log("Instance created");
  }

  /*
  **  properties
  */

  public getUserByID(userID: number): User | undefined {
    return this.usersByID_.get(userID);
  }

  public getUserByUUID(userUUID: string): User | undefined {
    return this.usersByUUID_.get(userUUID);
  }
  
  public getUserByName(userName?: string): User | undefined {
    return this.usersByName_.get(userName!);
  }

  public getUserBySocket(userSocket: Socket): User | undefined {
    return this.usersBySocket_.get(userSocket);
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

  public getChannels(): Channel[] {
    return Array.from(this.channelsByName_.values());
  }

  public getUsers(): User[] {
    return Array.from(this.usersByName_.values());
  }

  public getConversations(): Conversation[] {
    return Array.from(this.conversationsByUUID_.values());
  }

  public addUser(userInfo: UserData | UserDB ) {
    let sourceUser = new User(userInfo);

    this.usersByID_.set(sourceUser.id, sourceUser);
    this.usersByUUID_.set(sourceUser.uuid, sourceUser);
    this.usersByName_.set(sourceUser.name, sourceUser);
    this.usersBySocket_.set(sourceUser.socket, sourceUser);

    this.raise_<void>('onUserAdded', { sourceUser }); 
    console.log(`addUser ${sourceUser.uuid} (${sourceUser.name})`);;
  }

  public addChannel(channelInfo: ChannelData | ChannelDB ) {
    if (channelInfo instanceof ChannelDB)
      return;
    let channel = new Channel(channelInfo);

    this.channelsByName_.set(channel.name, channel);
    this.channelsByUUID_.set(channel.uuid, channel);
    this.raise_<void>('onChannelAdded', { channel });
  }

  public renameUser(userUUID: string, nickname: string) {

  }

  /*
  **  methods
  */

  public topicChannelUUID(sourceUser: User, channelUUID: string, text: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);
    const topic: ChannelTopic = {
      uuid: sourceUser.uuid,
      date: new Date(),
      text: text,
    };

    if (!channel) return this.message_(ReturnCode.ChannelNotExists);
    if (!channel.hasUser(sourceUser)) return this.message_(ReturnCode.NotInChannel);
    if (!channel.hasPrivileges(sourceUser)) return this.message_(ReturnCode.InsufficientPrivileges);
    if (channel.topic?.text === text) return this.message_(ReturnCode.Allowed);

    if (this.raise_<boolean>('onChannelTopicChanging', { channel, topic }).includes(true))
      return this.message_(ReturnCode.Denied);

    this.raise_<void>('onChannelTopicChanged', { channel, topic });
    channel.topic = topic;
    return this.message_(ReturnCode.Allowed);
  }

  public connectUser(client: Socket): ReturnMessage {
    const sourceUser = this.getUserByID(client.data.userID);

    if (sourceUser === undefined) return this.message_(ReturnCode.UserNotExists);
    if (sourceUser.isDisabled()) return this.message_(ReturnCode.Denied);
    if (sourceUser.isBanned()) return this.message_(ReturnCode.Denied);

    if (this.raise_<boolean>('onUserConnecting', { sourceUser }).includes(true)) 
      return this.message_(ReturnCode.Denied);

    sourceUser.status = UserStatus.ONLINE;
    this.raise_<void>('onUserConnected', { sourceUser });
    return this.message_(ReturnCode.Allowed);
  }

  public disconnectUser(sourceUser: User): ReturnMessage {
    sourceUser.status = UserStatus.OFFLINE;
    this.raise_<void>('onUserDisconnect', { sourceUser });
    return this.message_(ReturnCode.Allowed);
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

  public createChannelName(user: User, channelName: string, password?: string): ReturnMessage {
    let channel = this.getChannelByName(channelName);
    const channelData: ChannelData = {
      uuid: "",
      name: channelName,
      owner: user,
      password: password,
    };

    if (!checkChannelName(channelName)) return this.message_(ReturnCode.BadChannelName);
    if (channel) return this.message_(ReturnCode.ChannelExists);

    if (this.raise_<boolean>('onChannelCreating', { channelData }).includes(true))
      return this.message_(ReturnCode.Denied);
    if (!channelData.uuid) {
      this.logger_.debug("No UUID provided for the new channel. Generating one...");
      channelData.uuid = uuidv4();
    }
    channel = new Channel(channelData)
    channel.addUser(user);
    user.addChannel(channel);
    channel.addGenericEvent(EventContentType.CREATE, user);
    this.raise_<void>('onChannelCreated', { channel, user });
    return this.message_(ReturnCode.Allowed, { channel });
  }

  public deleteChannelUUID(user: User, channelUUID: string): ReturnMessage {
    const channel = this.getChannelByUUID(channelUUID);

    if (!channel) return this.message_(ReturnCode.ChannelNotExists);
    if (!channel.isOwner(user)) return this.message_(ReturnCode.InsufficientPrivileges);

    this.raise_<void>('onChannelDeleted', { channel, user });
    channel.getUsers().forEach(user => {
      user.removeChannel(channel);
    });
    this.destroyChannel_(channel);

    return this.message_(ReturnCode.Allowed);
  }

  public joinChannelUUID(user: User, channelUUID: string, password?: string): ReturnMessage {
    let channel = this.getChannelByUUID(channelUUID);

    if (!channel) return this.message_(ReturnCode.ChannelNotExists);
    if (channel.hasUser(user)) return this.message_(ReturnCode.AlreadyInChannel);
    if (channel.hasBanned(user)) return this.message_(ReturnCode.BannedFromChannel);
    if (channel.password !== password) return this.message_(ReturnCode.InvalidPassword);

    if (this.raise_<boolean>('onUserJoining', { channel, user }).includes(true))
      return this.message_(ReturnCode.Denied);

    channel.addUser(user);
    user.addChannel(channel);
    channel.addGenericEvent(EventContentType.JOIN, user);
    this.raise_<void>('onUserJoined', { channel, user });
    return this.message_(ReturnCode.Allowed, { channel });
  }

  public partChannelUUID(user: User, channelUUID: string): ReturnMessage {
    let channel = this.getChannelByUUID(channelUUID);

    if (!channel) return this.message_(ReturnCode.ChannelNotExists);
    if (!channel.hasUser(user)) return this.message_(ReturnCode.NotInChannel);

    if (this.raise_<boolean>('onUserParting').includes(true))
      return this.message_(ReturnCode.Denied);

    this.raise_<void>('onUserParted', { channel, user });
    channel.removeUser(user);
    user.removeChannel(channel);
    channel.addGenericEvent(EventContentType.PART, user);
    if (channel.isEmpty)
      this.destroyChannel_(channel);
    return this.message_(ReturnCode.Allowed);
  }

  private destroyChannel_(channel: Channel): void {
    this.channelsByUUID_.delete(channel.uuid);
    this.channelsByName_.delete(channel.name);
  }
  
  public listChannels(): ReturnMessage {
    let channelList: ChannelDetails[] = [];

    for (const channel of this.getChannels()) {
      channelList.push(channel.getDetails());
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
    channel.addGenericEvent(EventContentType.PASSWORD, sourceUser);
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
    channel.addGenericEvent(EventContentType.BAN, targetUser);
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

    channel.addGenericEvent(EventContentType.UNBAN, targetUser);
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
    channel.addGenericEvent(EventContentType.PROMOTE, sourceUser, targetUser);
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

    if (this.raise_<boolean>("onUserDemoting", { channel, sourceUser, targetUser }).includes(true))
      return this.message_(ReturnCode.Denied);

    channel.addGenericEvent(EventContentType.DEMOTE, sourceUser, targetUser);
    this.raise_<void>("onUserDemoted", { channel, sourceUser, targetUser });
    channel.removeOper(targetUser);
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
    this.raise_<void>('onChatDataLoad', dataLoader)
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
