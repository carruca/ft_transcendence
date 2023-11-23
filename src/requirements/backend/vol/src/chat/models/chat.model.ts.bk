import { UserModel as User, ChannelModel as Channel, ConversationModel as Conversation, EventModel as Event } from '.'
import { UserData, UserDetails, ChannelData, ChannelTopic, ChannelDetails, ConversationData } from '../interfaces'
import { UserStatus, UserChannelRole, UserSiteRole, EventContentType } from '../enums';
import { UserNotFoundError, PropertyUndefinedError } from '../errors';
import { MultiMap, BidirectionalMap } from '../utils';
import { Socket } from 'socket.io';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

//export interface onChannelCreated { (channel: Channel): void};
export type onChannelCreated = (channel: Channel) => void;
export type onChannelDestroyed = (channel: Channel) => void;
export type onChannelTopicChanged = (channel: Channel, sourceUser: User, newTopic: string) => void;
export type onChannelPasswordChanged = (channel: Channel, sourceUser: User, newPassword: string) => void;
export type onChannelMessageSended = (channel: Channel, sourceUser: User, message: string) => void;
export type onChannelBanned = (channel: Channel, sourceUser: User, targetUser: User) => void;
export type onChannelUnbanned = (channel: Channel, sourceUser: User, targetUser: User) => void;
export type onUserJoined = (channel: Channel, sourceUser: User) => void;
export type onUserParted = (channel: Channel, sourceUser: User, message: string) => void;
export type onUserKicked = (channel: Channel, sourceUser: User, targetUser: User, message: string) => void;
export type onUserMuted = (channel: Channel, sourceUser: User, targetUser: User) => void;
export type onUserBlocked = (channel: Channel, sourceUser: User, targetUser: User) => void;
export type onUserUnblocked = (channel: Channel, sourceUser: User, targetUser: User) => void;
export type onUserCreated = (user: User) => void;
export type onUserDestroyed = (user: User) => void;
export type onUserReconnected = (user: User, newSocket: Socket) => void;
export type onUserMessageSended = (sourceUser: User, targetUser: User, message: string) => void;
//export type onUserBlocked = (sourceUser: User, targetUser: User) => void;
//export type onUserUnblocked = (sourceUser: User, targetUser: User) => void;
export type onUserNameChanged = (user: User, name: string) => void;
export type onUserStatusChanged = (user: User, status: UserStatus) => void;

export type onChannelCreating = (channelName: ChannelData) => boolean;
export type onChannelTopicChanging = (channel: Channel, user: User) => boolean;
export type onChannelPasswordChanging = (channel: Channel, sourceUser: User) => void;
export type onChannelMessageSending = (channel: Channel, sourceUser: User, message: string) => boolean;
export type onUserJoining = (channel: Channel, sourceUser: User) => boolean;
export type onUserParting = (channel: Channel, sourceUser: User) => boolean;
export type onUserKicking = (channel: Channel, sourceUser: User, targetUser: User) => boolean;
export type onUserMuting = (channel: Channel, sourceUser: User, targetUser: User) => boolean;
export type onChannelBaning = (channel: Channel, sourceUser: User, targetUser: User) => boolean;
export type onChannelUnbaning = (channel: Channel, sourceUser: User, targetUser: User) => boolean;
export type onUserMessageSending = (sourceUser: User, targetUser: User) => boolean;
export type onUserBlocking = (sourceUser: User, targetUser: User) => boolean;
export type onUserUnblocking = (sourceUser: User, targetUser: User) => boolean;
export type onUserNameChanging = (user: User, name: string) => boolean;
export type onUserStatusChanging = (user: User, status: UserStatus) => boolean;

export const ChatEventTypes = {
    onChannelCreated: 'onChannelCreated',
    onChannelCreating: 'onChannelCreating',
    onChannelDestroyed: 'onChannelDestroyed',
    onChannelPasswordChanging: 'onChannelPasswordChanging',
    onChannelPasswordChanged: 'onChannelPasswordChanged',
    onChannelTopicChanging: 'onChannelTopicChanging',
    onChannelTopicChanged: 'onChannelTopicChanged',
    onChannelMessageSending: 'onChannelMessageSending',
    onChannelMessageSended: 'onChannelMessageSended',
}

export enum ChatReturnCode {
    Allowed,
    Denied,
    UserNotExists,
    UserNotConnected,
    UserInGame,
    NameInUse,
    ChannelNotExists,
    NotInChannel,
    NothingHappened,
    AlreadyInChannel,
    BadChannelName,
    CannotSendToChannel,
    InvalidPassword,
    InsufficientPrivileges,
    BannedFromChannel,
    BadUserName,
    Error,
}

export interface ChatReturnMessage {
    code: ChatReturnCode;
    message: string;
    data?: any;
}

export const ChatReturnMessages: Record<ChatReturnCode, ChatReturnMessage> = {
    [ChatReturnCode.Allowed]: {
        code: ChatReturnCode.Allowed,
        message: "Allowed",
    },
    [ChatReturnCode.Denied]: {
        code: ChatReturnCode.Denied,
        message: "Denied",
    },
    [ChatReturnCode.UserNotExists]: {
        code: ChatReturnCode.UserNotExists,
        message: "User not exists",
    },
    [ChatReturnCode.UserNotConnected]: {
        code: ChatReturnCode.UserNotConnected,
        message: "User not connected",
    },
    [ChatReturnCode.UserInGame]: {
        code: ChatReturnCode.UserInGame,
        message: "User in game",
    },
    [ChatReturnCode.NameInUse]: {
        code: ChatReturnCode.NameInUse,
        message: "Name in use",
    },
    [ChatReturnCode.ChannelNotExists]: {
        code: ChatReturnCode.ChannelNotExists,
        message: "Channel not exists",
    },
    [ChatReturnCode.NotInChannel]: {
        code: ChatReturnCode.NotInChannel,
        message: "You're not in that channel",
    },
    [ChatReturnCode.AlreadyInChannel]: {
        code: ChatReturnCode.AlreadyInChannel,
        message: "You're already in that channel",
    },
    [ChatReturnCode.BadChannelName]: {
        code: ChatReturnCode.BadChannelName,
        message: "Bad channel name",
    },
    [ChatReturnCode.CannotSendToChannel]: {
        code: ChatReturnCode.CannotSendToChannel,
        message: "Cannot send to channel",
    },
    [ChatReturnCode.InvalidPassword]: {
        code: ChatReturnCode.InvalidPassword,
        message: "Password incorrect",
    },
    [ChatReturnCode.InsufficientPrivileges]: {
        code: ChatReturnCode.InsufficientPrivileges,
        message: "Insufficient privileges",
    },
    [ChatReturnCode.BannedFromChannel]: {
        code: ChatReturnCode.BannedFromChannel,
        message: "Banned from channel",
    },
    [ChatReturnCode.NothingHappened]: {
        code: ChatReturnCode.NothingHappened,
        message: "Nothing happened",
    },
    [ChatReturnCode.BadUserName]: {
        code: ChatReturnCode.BadUserName,
        message: "Bad username",
    },
    [ChatReturnCode.Error]: {
        code: ChatReturnCode.Error,
        message: "Error",
    },
}

export function ChatEventManager() {
    return function<T extends { new (...args: any[]): {} }>(target: T) {
        return class extends target {
            chat: Chat;

            constructor(...args: any[]) {
                super(...args);
                this.chat.autoSubscribeEvents(this, target);
            }
        }
    }
}

export function ChatInstance(): PropertyDecorator {
  return function(target: Object, propertyKey: string | symbol) {

    Object.defineProperty(target, propertyKey, {
      get: function() {
        //const chatInstance = Reflect.getMetadata('chatInstance', target.constructor);
        //console.log("chatInstance: ", chatInstance as typeof chatInstance)
        //return chatInstance;
        return Chat.instance();
      },
      enumerable: true,
      configurable: true,
    });
  };
}

export function ChatSubscribeEvent(eventName: string): MethodDecorator {
    return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('chat_event', eventName, descriptor.value);
    };
}

function withChannelInstance(target: any, propertyKey: string, parameterIndex: number) {
  const originalMethod = target[propertyKey];

  target[propertyKey] = function (...args: any[]) {
    const channelName = args[parameterIndex]; // Obtener el valor del argumento en la posición especificada

    // Obtener la instancia del canal a partir del nombre
    const channel = this.channelsByName_.get(channelName);

    if (!channel) {
      return ChatReturnCode.ChannelNotExists;
    }

    // Reemplazar el valor del argumento con la instancia del canal
    args[parameterIndex] = channel;

    // Llamar al método original con los argumentos modificados
    return originalMethod.apply(this, args);
  };
}

export function ChatReturnDecorator() {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]) {
      const code = originalMethod.apply(this, args);
      const message = this.chatMessage(code);
      return message; // Devuelve el mensaje en lugar del código
    };
    return descriptor;
  };
}

export class Chat {
    private usersByUUID_: Map<string, User>;
    private usersByName_: Map<string, User>;
    private usersBySocket_: Map<Socket, User>;
    private channelsByName_: Map<string, Channel>;
    private channelsByUUID_: Map<string, Channel>;
    private conversationsByUUID_: Map<string, Conversation>;
    private conversationsByUsers_: BidirectionalMap<User, Conversation>;
    private events_: MultiMap<string, Function>;
    private logger_: Logger;
    private static singleton: Chat;

    private constructor() {
        this.usersByUUID_ = new Map<string, User>();
        this.usersByName_ = new Map<string, User>();
        this.usersBySocket_ = new Map<Socket, User>();
        this.channelsByName_ = new Map<string, Channel>();
        this.channelsByUUID_ = new Map<string, Channel>();
        this.conversationsByUUID_ = new Map<string, Conversation>();
        this.conversationsByUsers_ = new BidirectionalMap<User, Conversation>();
        this.events_ = new MultiMap<string, Function>();
        this.logger_ = new Logger("Chat");
        this.logger_.debug("Instance created");
    }

    public static instance(): Chat {
        if (!Chat.singleton)
            Chat.singleton = new Chat();
        return Chat.singleton;
    }

    public createUser(userData: UserData): ChatReturnMessage {
        let user = this.getUserByUUID(userData.uuid);

        if (user) {
            this.raise_<void>("onUserReconnected", { user, newSocket: userData.socket });
        } else {
            user = this.getUserByName(userData.name);
            if (user) //Si el usuario que se va a crear existe... entonces devolvemos false
                return this.chatMessage(ChatReturnCode.NameInUse);
            if (!userData.uuid) {
                this.logger_.debug("No UUID provided for new user. Generating one...");
                userData.uuid = uuidv4();
            }
            user = new User(userData);
            this.usersByUUID_.set(user.uuid, user);
            this.usersBySocket_.set(user.socket, user);
            this.usersByName_.set(user.name, user);
            this.raise_<void>("onUserCreated", { user });
        }
        return this.chatMessage(ChatReturnCode.Allowed, user);
    }

    public deleteUser(user?: User | string): ChatReturnMessage {
        if (typeof user === 'string')
            user = this.getUserByUUID(user);
        if (!user)
            return this.chatMessage(ChatReturnCode.NothingHappened);
        this.usersByUUID_.delete(user.uuid);
        this.usersBySocket_.delete(user.socket);
        this.usersByName_.delete(user.name);

        this.closeConversations_(user);
        this.partChannels_(user);
        this.raise_<void>("onUserDestroyed", { user });
        return this.chatMessage(ChatReturnCode.Allowed);
        // delete user;
    }

    public createConversation(user1: User, user2: User): ChatReturnMessage {
        let conversation: Conversation;
        const conversationData: ConversationData = {
            user1: user1,
            user2: user2,
        };

        if (user1.is(user2))
           return this.chatMessage(ChatReturnCode.NothingHappened);

        const value = this.raise_<boolean>("onConversationCreating", { conversationData });
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        if (!conversationData.uuid) {
            this.logger_.debug("No UUID provided for new conversation.Generating one...");
            conversationData.uuid = uuidv4();
        }
        conversation = new Conversation(conversationData);
        this.conversationsByUUID_.set(conversation.uuid, conversation);
        this.conversationsByUsers_.set(conversation.user1, conversation.user2, conversation);
        this.raise_<void>("onConversationCreated", { conversation });
        return this.chatMessage(ChatReturnCode.Allowed, { conversation });
    }

    public deleteConversation(conversation?: Conversation | string): ChatReturnMessage {
        if (typeof conversation === "string")
            conversation = this.getConversationByUUID(conversation);
        if (!conversation) return this.chatMessage(ChatReturnCode.NothingHappened);
        this.conversationsByUUID_.delete(conversation.uuid);
        this.conversationsByUsers_.delete(conversation.user1, conversation.user2)
        this.raise_<void>("onConversationDeleted", { conversation });
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public createChannel(channelData: ChannelData): ChatReturnMessage {
        const value: boolean[] = this.raise_<boolean>("onChannelCreating", { channelData })
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        if (!channelData.uuid) {
            this.logger_.debug("No UUID provided for the new channel. Generating one...");
            channelData.uuid = uuidv4();
        }
        const channel = new Channel(channelData);
        console.log("Se ha creado un canal, el owner es", channelData.owner.uuid);

        this.channelsByName_.set(channel.name, channel);
        this.channelsByUUID_.set(channel.uuid, channel);
        //TODO: La base de datos debería subscribirse a este evento para crear el canal
        this.raise_<void>("onChannelCreated", { channel });
        return this.chatMessage(ChatReturnCode.Allowed, { channel });
    }

    public deleteChannel(channel?: Channel | string): ChatReturnMessage {
        if (typeof channel === "string")
            channel = this.getChannelByUUID(channel);
        if (!channel)
            return this.chatMessage(ChatReturnCode.NothingHappened);
        if (!channel.uuid || !channel.name)
            return this.chatMessage(ChatReturnCode.Error);
        this.channelsByUUID_.delete(channel.uuid);
        this.channelsByName_.delete(channel.name);
        //TODO: La base de datos debería subscribirse a este evento para eliminar el canal
        this.raise_<void>("onChannelDeleted", { channel });
        //delete channel;
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public getUserByUUID(userUUID: string): User | undefined {
        return this.usersByUUID_.get(userUUID);
    }

    public getUserBySocket(userSocket: Socket): User {
        const user = this.usersBySocket_.get(userSocket);
        if (!user)
            throw new UserNotFoundError("There is no user associated with that socket");
        return user;
    }

    public getUserByName(userName?: string): User | undefined {
        return this.usersByName_.get(userName!);
    }

    public getChannelByUUID(channelUUID: string): Channel | undefined {
        return this.channelsByUUID_.get(channelUUID);
    }

    public getChannelByName(channelName: string): Channel | undefined {
        return this.channelsByName_.get(channelName);
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
        return Array.from(this.usersByUUID_.values());
    }

    public getConversations(): Conversation[] {
        return Array.from(this.conversationsByUUID_.values());
    }

    public topicChannel(user: User, channelName: string, text: string): ChatReturnMessage {
        const channel = this.getChannelByName(channelName);
        const topic: ChannelTopic = {
            uuid: user.uuid,
            date: new Date(),
            text: text,
        }

        if (!channel) return this.chatMessage(ChatReturnCode.ChannelNotExists);
        if (!channel.hasUser(user)) return this.chatMessage(ChatReturnCode.NotInChannel);
        if (!channel.hasPrivileges(user)) return this.chatMessage(ChatReturnCode.InsufficientPrivileges);
        if (channel.topic?.text === text) return this.chatMessage(ChatReturnCode.Allowed);

        const value: boolean[] = this.raise_<boolean>("onChannelTopicChanging", { channel, topic })
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        this.raise_<void>("onChannelTopicChanged", { channel, topic });
        channel.topic = topic;
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public promoteUser(user: User, channelName: string, targetUserName: string): ChatReturnMessage {
        const channel = this.getChannelByName(channelName);
        const targetUser = this.getUserByName(targetUserName);

        if (!channel) return this.chatMessage(ChatReturnCode.ChannelNotExists);
        if (!channel.hasUser(user)) return this.chatMessage(ChatReturnCode.NotInChannel);
        if (!channel.hasPrivileges(user)) return this.chatMessage(ChatReturnCode.InsufficientPrivileges);
        if (!targetUser) return this.chatMessage(ChatReturnCode.UserNotExists);
        if (!channel.hasUser(targetUser)) return this.chatMessage(ChatReturnCode.NotInChannel);
        //if (channel.owner === targetUser) return this.chatMessage(ChatReturnCode.InsufficientPrivileges);
        if (channel.hasOper(targetUser)) return this.chatMessage(ChatReturnCode.NothingHappened);

        const value: boolean[] = this.raise_<boolean>("onUserPromoting", { channel, user, targetUser });
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        this.raise_<void>("onUserPromoted", { channel, user, targetUser });
        channel.addOper(targetUser);
        channel.addGenericEvent(EventContentType.PROMOTE, user, targetUser);
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public demoteUser(user: User, channelName: string, targetUserName: string): ChatReturnMessage {
        const channel = this.getChannelByName(channelName);
        const targetUser = this.getUserByName(targetUserName);

        if (!channel) return this.chatMessage(ChatReturnCode.ChannelNotExists);
        if (!channel.hasUser(user)) return this.chatMessage(ChatReturnCode.NotInChannel);
        if (!channel.hasPrivileges(user)) return this.chatMessage(ChatReturnCode.InsufficientPrivileges);
        if (!targetUser) return this.chatMessage(ChatReturnCode.UserNotExists);
        if (!channel.hasUser(targetUser)) return this.chatMessage(ChatReturnCode.NotInChannel);
        //if (channel.owner === targetUser) return this.chatMessage(ChatReturnCode.InsufficientPrivileges);
        if (!channel.hasOper(targetUser)) return this.chatMessage(ChatReturnCode.NothingHappened);

        const value: boolean[] = this.raise_<boolean>("onUserDemoting", { channel, user, targetUser });
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        channel.addGenericEvent(EventContentType.DEMOTE, user, targetUser);
        this.raise_<void>("onUserDemoted", { channel, user, targetUser });
        channel.removeOper(targetUser);
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public nameUser(user: User, newName: string): ChatReturnMessage {
        const newUser = this.getUserByName(newName);

        if (!this.checkUserName_(newName)) return this.chatMessage(ChatReturnCode.BadUserName);
        if (newUser) return this.chatMessage(ChatReturnCode.NameInUse);

        const value: boolean[] = this.raise_<boolean>("onUserNameChanging", { user, newName });
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        this.usersByName_.delete(user.name);
        this.usersByName_.set(newName, user);
        user.name = newName;
        this.raise_<void>("onUserNameChanged", { user, newName });
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public channelMessage(user: User, targetChannelUUID: string, message: string): ChatReturnMessage {
        const targetChannel = this.getChannelByUUID(targetChannelUUID);
        const event = Event.message(user, message);
        const payload = {
            senderUser: user,
            targetChannel: targetChannel,
            event: event
        }

        if (!targetChannel) return this.chatMessage(ChatReturnCode.ChannelNotExists);
        if (!targetChannel.hasUser(user)) return this.chatMessage(ChatReturnCode.NotInChannel);
        if (targetChannel.hasMuted(user)) return this.chatMessage(ChatReturnCode.CannotSendToChannel);
        if (targetChannel.hasBanned(user)) return this.chatMessage(ChatReturnCode.CannotSendToChannel);

        const value: boolean[] = this.raise_<boolean>("onChannelMessageSending", payload);
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        targetChannel.addEvent(event);
        this.raise_<void>("onChannelMessageSended", payload);
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public conversationMessage(user: User, targetConversationUUID: string, message: string): ChatReturnMessage {
        const targetConversation = this.getConversationByUUID(targetConversationUUID);
        const event = Event.message(user, message);
        let payload = {
            senderUser: user,
            targetConversation: targetConversation,
            event: event,
        }

        if (!targetConversation) return this.chatMessage(ChatReturnCode.UserNotExists);
        if (targetConversation.hasBlocked(user)) return this.chatMessage(ChatReturnCode.NothingHappened);

        const value: boolean[] = this.raise_<boolean>("onUserMessageSending", payload);
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);
        targetConversation.addEvent(event);
        this.raise_<void>("onUserMessageSended", payload);
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public typeUser(user: User, typing: boolean, filterUUID: string): ChatReturnMessage {
        const notifyChannel = this.getChannelByUUID(filterUUID);
        const notifyConversation = this.getConversationByUUID(filterUUID);
        let eventData;

        if (notifyChannel) {
            if (!notifyChannel.hasUser(user)) return this.chatMessage(ChatReturnCode.NotInChannel);
            eventData = { user, typing, notifyChannel };
        } else if (notifyConversation) {
            //if (!user.hasWatcher(notifyUser)) return ChatReturnCode.UserNotExists;
            eventData = { user, typing, notifyConversation };
        } else return this.chatMessage(ChatReturnCode.NothingHappened);

        const value: boolean[] = this.raise_<boolean>("onUserTypeChanging", eventData);
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        this.raise_<void>("onUserTypeChanged", eventData);
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public updateUser(user: User, userDetails: UserDetails): ChatReturnMessage {
        let changed: boolean = false;

        if (userDetails.status && user.status !== userDetails.status) changed = true;
        else userDetails.status = undefined;
        if (userDetails.name && user.name !== userDetails.name) changed = true;
        else userDetails.name = undefined;
        if (userDetails.siteRole && user.siteRole !== userDetails.siteRole) changed = true;
        else userDetails.siteRole = undefined;
        if (!changed) return this.chatMessage(ChatReturnCode.NothingHappened);

        const value: boolean[] = this.raise_<boolean>("onUserUpdating", { user, userDetails });
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        if (userDetails.status) user.status = userDetails.status;
        if (userDetails.name) user.name = userDetails.name;
        if (userDetails.siteRole) user.siteRole = userDetails.siteRole;
        this.raise_<void>("onUserUpdated", { user, userDetails });
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public joinChannel(user: User, channelName: string, password?: string): ChatReturnMessage {
        let channel = this.getChannelByName(channelName);
        const channelData: ChannelData = {
            uuid: "",
            name: channelName,
            owner: user,
            password: password,
        };

        if (!this.checkChannelName_(channelName)) return this.chatMessage(ChatReturnCode.BadChannelName);
        if (!channel) {
            const ret = this.createChannel(channelData);
            channel = ret.data.channel;
            //console.log("ret:", ret);
        }
        if (!channel) return this.chatMessage(ChatReturnCode.Denied);
        if (channel.hasUser(user)) return this.chatMessage(ChatReturnCode.AlreadyInChannel);
        if (channel.hasBanned(user)) return this.chatMessage(ChatReturnCode.BannedFromChannel);
        if (channel.password !== password) return this.chatMessage(ChatReturnCode.InvalidPassword);

        const value: boolean[] = this.raise_<boolean>("onUserJoining", { channel, user });
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        channel.addUser(user);
        user.addChannel(channel);
        channel.addGenericEvent(EventContentType.JOIN, user);
        this.raise_<void>("onUserJoined", { channel, user });
        return this.chatMessage(ChatReturnCode.Allowed, { channel });
    }

    public passwordChannel(user: User, channelName: string, newPassword: string): ChatReturnMessage {
        const channel = this.getChannelByName(channelName);

        if (!this.checkChannelName_(channelName)) return this.chatMessage(ChatReturnCode.BadChannelName);
        if (!channel)
            return this.chatMessage(ChatReturnCode.ChannelNotExists);
        if (!channel.hasPrivileges(user))
            return this.chatMessage(ChatReturnCode.InsufficientPrivileges);
        if (channel.password === newPassword) return this.chatMessage(ChatReturnCode.NothingHappened);

        const value: boolean[] = this.raise_<boolean>("onChannelPasswordChanging", { channel, user, newPassword })
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        this.raise_<void>("onChannelPasswordChanged", { channel, user, newPassword });
        channel.password = newPassword;
        channel.addGenericEvent(EventContentType.PASSWORD, user);
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public partChannel(user: User, channelName: string): ChatReturnMessage {
        const channel = this.getChannelByName(channelName);

        if (!this.checkChannelName_(channelName)) return this.chatMessage(ChatReturnCode.BadChannelName);
        if (!channel) return this.chatMessage(ChatReturnCode.ChannelNotExists);
        if (!channel.hasUser(user)) return this.chatMessage(ChatReturnCode.NotInChannel);

        const value: boolean[] = this.raise_<boolean>("onUserParting", { channel, user });
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        this.raise_<void>("onUserParted", { channel, user });
        channel.removeUser(user);
        user.removeChannel(channel);
        channel.addGenericEvent(EventContentType.PART, user);
        if (channel.isEmpty)
            this.deleteChannel(channel);
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public forceCloseChannel(user: User, channelName: string, message: string): ChatReturnMessage {
        const channel = this.getChannelByName(channelName);

        if (!this.checkChannelName_(channelName)) return this.chatMessage(ChatReturnCode.BadChannelName);
        if (!channel) return this.chatMessage(ChatReturnCode.ChannelNotExists);
        if (!channel.hasPrivileges(user) && !user.hasPrivileges()) return this.chatMessage(ChatReturnCode.InsufficientPrivileges);

        const value: boolean[] = this.raise_<boolean>("onChannelForceClosing", { channel, user });
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        this.raise_<void>("onChannelForceClosed", { channel, user });
        this.cleanChannel(channel);
        this.deleteChannel(channel);
        //TODO: hacer que los usuarios dejen de tener ese canal y eliminar el canal
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public kickUser(user: User, channelName: string, targetUserName: string, message?: string): ChatReturnMessage {
        const channel = this.getChannelByName(channelName);
        const targetUser = this.getUserByName(targetUserName);

        if (!this.checkChannelName_(channelName)) return this.chatMessage(ChatReturnCode.BadChannelName);
        if (!channel) return this.chatMessage(ChatReturnCode.ChannelNotExists);
        if (!channel.hasUser(user)) return this.chatMessage(ChatReturnCode.NotInChannel);
        if (!channel.hasPrivileges(user)) return this.chatMessage(ChatReturnCode.InsufficientPrivileges);
        if (!targetUser) return this.chatMessage(ChatReturnCode.UserNotExists);
        if (!channel.hasUser(targetUser)) return this.chatMessage(ChatReturnCode.NotInChannel);
        if (channel.owner === targetUser) return this.chatMessage(ChatReturnCode.InsufficientPrivileges);

        const value: boolean[] = this.raise_<boolean>("onUserKicking", {channel, user, targetUser});
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        this.raise_<void>("onUserKicked", {channel, user, targetUser, message});
        channel.removeUser(targetUser);
        targetUser.removeChannel(channel);
        channel.addKickEvent(user, targetUser, message);
        if (channel.isEmpty)
            this.deleteChannel(channel);
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    //los mensajes que se envían a un contacto bloqueado, no se tienen que entregar, ni ahora ni como parte del historial
    //eso quiere decir que, de algún modo,
    public sendConversation(user: User, targetUserUUID: string, message: string): ChatReturnMessage {
        const targetUser = this.getUserByUUID(targetUserUUID);
        let conversation: Conversation | undefined;
        let ret: ChatReturnMessage | undefined;
//        const retData: ChatReturnMessage;

        if (!targetUser) return this.chatMessage(ChatReturnCode.UserNotExists);
      //  if (targetUser.hasBlocked(user)) return this.chatMessage(ChatReturnCode.NothingHappened);
        if (targetUser)
            conversation = this.getConversationByUsers(user, targetUser);

        if (!conversation) {
            ret = this.createConversation(user, targetUser);
            if (ret.code !== ChatReturnCode.Allowed)
                return ret;
            conversation = ret.data.conversation;
        }

        const value: boolean[] = this.raise_<boolean>("onConversationMessageSending", { conversation, user, targetUser });
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        const messageEvent = conversation!.addMessageEvent(user, message);
        this.raise_<void>("onConversationMessageSended", { conversation, messageEvent });
        return this.chatMessage(ChatReturnCode.Allowed, { conversation, messageEvent });
    }

    public sendChannel(user: User, channelUUID: string, message: string): ChatReturnMessage {
        const channel = this.getChannelByUUID(channelUUID);

        //if (!this.checkChannelName_(channelName)) return this.chatMessage(ChatReturnCode.BadChannelName);
        if (!channel) return this.chatMessage(ChatReturnCode.ChannelNotExists);
        if (!channel.hasUser(user)) return this.chatMessage(ChatReturnCode.NotInChannel);
        if (channel.hasMuted(user)) return this.chatMessage(ChatReturnCode.CannotSendToChannel);

        const value: boolean[] = this.raise_<boolean>("onChannelMessageSending", { channel, user });
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        //TODO: guardar mensaje en memoria
        const messageEvent = channel.addMessageEvent(user, message);
        this.raise_<void>("onChannelMessageSended", { channel, user, messageEvent });
        return this.chatMessage(ChatReturnCode.Allowed, { channel, messageEvent });
    }

    public muteUser(user: User, channelName: string, targetUserName: string): ChatReturnMessage {
        const channel = this.getChannelByName(channelName);
        const targetUser = this.getUserByName(targetUserName);

        if (!this.checkChannelName_(channelName)) return this.chatMessage(ChatReturnCode.BadChannelName);
        if (!channel) return this.chatMessage(ChatReturnCode.ChannelNotExists);
        if (!channel.hasUser(user)) return this.chatMessage(ChatReturnCode.NotInChannel);
        if (!targetUser) return this.chatMessage(ChatReturnCode.UserNotExists);
        if (!channel.hasUser(targetUser)) return this.chatMessage(ChatReturnCode.NotInChannel);
        if (channel.owner === targetUser) return this.chatMessage(ChatReturnCode.InsufficientPrivileges);

        const value: boolean[] = this.raise_<boolean>("onUserMuting", { channel, user, targetUser });
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        channel.addMute(targetUser);
        channel.addGenericEvent(EventContentType.MUTE, user);
        this.raise_<void>("onUserMuted", { channel, user, targetUser });
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public unmuteUser(user: User, channelName: string, targetUserName: string): ChatReturnMessage {
        const channel = this.getChannelByName(channelName);
        const targetUser = this.getUserByName(targetUserName);

        if (!this.checkChannelName_(channelName)) return this.chatMessage(ChatReturnCode.BadChannelName);
        if (!channel) return this.chatMessage(ChatReturnCode.ChannelNotExists);
        if (!channel.hasUser(user)) return this.chatMessage(ChatReturnCode.NotInChannel);
        if (!targetUser) return this.chatMessage(ChatReturnCode.UserNotExists);
        if (!channel.hasUser(targetUser)) return this.chatMessage(ChatReturnCode.NotInChannel);
        if (channel.owner === targetUser) return this.chatMessage(ChatReturnCode.InsufficientPrivileges);

        const value: boolean[] = this.raise_<boolean>("onUserUnmuting", { channel, user, targetUser });
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        channel.removeMute(targetUser);
        channel.addGenericEvent(EventContentType.UNMUTE, user);
        this.raise_<void>("onUserUnmuted", { channel, user, targetUser });
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public banUser(user: User, channelName: string, targetUserName: string): ChatReturnMessage {
        const channel = this.getChannelByName(channelName);
        const targetUser = this.getUserByName(targetUserName);

        if (!this.checkChannelName_(channelName)) return this.chatMessage(ChatReturnCode.BadChannelName);
        if (!channel) return this.chatMessage(ChatReturnCode.ChannelNotExists);
        if (!targetUser) return this.chatMessage(ChatReturnCode.UserNotExists);
        if (!channel.hasUser(user)) return this.chatMessage(ChatReturnCode.NotInChannel);
        if (!channel.hasPrivileges(user)) return this.chatMessage(ChatReturnCode.InsufficientPrivileges);
        if (!channel.hasUser(targetUser)) return this.chatMessage(ChatReturnCode.NotInChannel);
        if (channel.owner === targetUser) return this.chatMessage(ChatReturnCode.InsufficientPrivileges);
        if (channel.hasBanned(targetUser)) return this.chatMessage(ChatReturnCode.Allowed);

        const value: boolean[] = this.raise_<boolean>("onUserBanning", { channel, user, targetUser });
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        this.raise_<void>("onUserBanned", { channel, user, targetUser });
        channel.addBan(targetUser);
        channel.removeUser(targetUser);
        channel.addGenericEvent(EventContentType.BAN, user);
        targetUser.removeChannel(channel);
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public unbanUser(user: User, channelName: string, targetUserUUID: string): ChatReturnMessage {
        const channel = this.getChannelByName(channelName);
        let targetUser = this.getUserByName(targetUserUUID);

        if (!targetUser) targetUser = this.getUserByUUID(targetUserUUID);

        if (!this.checkChannelName_(channelName)) return this.chatMessage(ChatReturnCode.BadChannelName);
        if (!channel) return this.chatMessage(ChatReturnCode.ChannelNotExists);
        if (!targetUser) return this.chatMessage(ChatReturnCode.UserNotExists);
        if (!channel.hasUser(user)) return this.chatMessage(ChatReturnCode.NotInChannel);
        if (!channel.hasPrivileges(user)) return this.chatMessage(ChatReturnCode.InsufficientPrivileges);
     //   if (!channel.hasUser(targetUser)) return this.chatMessage(ChatReturnCode.NotInChannel);
        if (channel.owner === targetUser) return this.chatMessage(ChatReturnCode.InsufficientPrivileges);
        if (!channel.hasBanned(targetUser)) return this.chatMessage(ChatReturnCode.Allowed);

        const value: boolean[] = this.raise_<boolean>("onUserUnbanning", { channel, user, targetUser });
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        channel.addGenericEvent(EventContentType.UNBAN, user);
        this.raise_<void>("onUserUnbanned", { channel, user, targetUser });
        channel.removeBan(targetUser);
        return this.chatMessage(ChatReturnCode.Allowed);

    }

    public blockUser(user: User, targetUserName: string): ChatReturnMessage {
        const targetUser = this.getUserByName(targetUserName);

        if (!targetUser) return this.chatMessage(ChatReturnCode.UserNotExists);
        if (user === targetUser) return this.chatMessage(ChatReturnCode.NothingHappened);
        if (user.hasBlocked(targetUser)) return this.chatMessage(ChatReturnCode.NothingHappened);

        const value: boolean[] = this.raise_<boolean>("onUserBlocking", { user, targetUser });
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        this.raise_<void>("onUserBlocked", { user, targetUser });
        user.addBlock(targetUser);
        return this.chatMessage(ChatReturnCode.Allowed);

    }

    public unblockUser(user: User, targetUserName: string): ChatReturnMessage {
        const targetUser = this.getUserByName(targetUserName);

        if (!targetUser) return this.chatMessage(ChatReturnCode.UserNotExists);
        if (user === targetUser) return this.chatMessage(ChatReturnCode.NothingHappened);
        if (!user.hasBlocked(targetUser)) return this.chatMessage(ChatReturnCode.NothingHappened);

        const value: boolean[] = this.raise_<boolean>("onUserUnblocking", { user, targetUser });
        if (value.includes(true))
            return this.chatMessage(ChatReturnCode.Denied);

        this.raise_<void>("onUserUnblocked", { user, targetUser });
        user.removeBlock(targetUser);
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public listChannels(): ChatReturnMessage {
        let channelList: ChannelDetails[] = [];

        for (const channel of this.getChannels()) {
            channelList.push(channel.getDetails());
        }
        return this.chatMessage(ChatReturnCode.Allowed, [ channelList ]);
    }

    public getStats(user: User): ChatReturnMessage {
        const payload = {
            user,
            channelCount: this.channelsByName_.size,
            userCount: this.usersByName_.size,
            evenCount: this.events_.size,
        }
        this.raise_<void>("onUserStats", payload);
        return this.chatMessage(ChatReturnCode.Allowed);
    }

    public subscribe(eventString: string, callback: Function, className: any): boolean {
      //  let event = this.getEventFromString_(eventString);

        this.logger_.debug(`event '${eventString}' subscribed from ${className.name}`)
        //console.log(`event: ${event} subscribed`);
        //TODO: verificar si callback cumple con el prototipo del event
       // if (event && this.checkCallbackType_(event, callback)) {
            this.events_.set(eventString, callback);
            return true;
       // }
        return false;
    }

    public unsubscribe(event: string, callback: Function): boolean {
        return this.events_.delete(event, callback);
    }

    public autoSubscribeEvents(instance: any, className: any) {
        let currentPrototype = Object.getPrototypeOf(instance);
        currentPrototype = Object.getPrototypeOf(currentPrototype);

        for (const propertyName of Object.getOwnPropertyNames(currentPrototype)) {
            const method = instance[propertyName];
            if (method) {
                const event = Reflect.getMetadata('chat_event', method);
                if (event)
                    this.subscribe(event, method.bind(instance), className);
            }
        }
    }

    private chatMessage(code: ChatReturnCode, data?: {}): ChatReturnMessage {
        const message = { ...ChatReturnMessages[code] };

       // console.log("chatMessage", data);
        message.data = data;
        return message;
    }

    public cleanChannel(channel: Channel): void {
        for (const user of channel.getUsers()) {
            channel.removeUser(user);
            user.removeChannel(channel);
        }
    }

    private closeConversations_(user: User): void {
        for (const conversation of user.getConversations())
            this.deleteConversation(conversation);
    }

    //TODO: Esta función debe ser utilizada sólo cuando un canal es eliminado a la fuerza.
    public partChannels_(user: User): void {
        for (const channel of user.getChannels()) {
            channel.removeUser(user);
            user.removeChannel(channel);
            if (channel.isEmpty)
                this.deleteChannel(channel);
            //user.removeChannel(channel);
        }
    }

    private checkChannelName_(channelName: string): boolean {
        //TODO: Verificar que no tiene caracteres extraños
        return channelName.startsWith('#');
    }

    private checkUserName_(userName: string): boolean {
        return true;
    }

    private raise_<T>(event: string, ...params: any[]): T[] {
        const results: T[] = [];
        const callbacks = this.events_.get(event);

        if (callbacks) {
            for (const callback of callbacks) {
                const result = callback(...params);
                results.push(result as T);
            }
        }
        return results;
    }

/*
    private checkCallbackType_(event: keyof typeof ChatEventTypes, callback: Function): boolean {
        const exptectedType = ({} as keyof typeof ChatEventTypes)[event];
        return callback instanceof Function && callback.length === exptectedType.length;
    }

    private getEventFromString_(eventString: string): ChatEventTypes | undefined {
        const event = eventString as typeof ChatEventTypes;
        return event;
    }
*/
}
