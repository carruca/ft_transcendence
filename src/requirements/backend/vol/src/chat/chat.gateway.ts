import { AuthService } from '../auth/auth.service';
import { ChatManager } from './managers';
import { ChannelModel as Channel, UserModel as User } from './models';
import { ChatManagerHandler, ChatManagerInstance, ChatManagerSubscribe } from './decorators';
import { verifyCookies } from './utils';
import { UserChannelRole, ReturnCode } from './enums';

import { MissingEnvironmentVariableError, InvalidCookieSignatureError, UserNotFoundError } from './errors';

import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@ChatManagerHandler()
@WebSocketGateway({
  cors: {
    // TODO change to ENV var -> process.env.FRONTEND
    origin: process.env.NEST_FRONT_URL
  },
})
export class ChatGateway {
  private readonly logger_ = new Logger("ChatGateway");

  @WebSocketServer()
  private server_: Server;

  @ChatManagerInstance()
  private chat_: ChatManager;

  constructor(chat: ChatManager, private readonly auth_: AuthService) {
    this.chat_ = chat;
    this.logger_.log("Instance created");
  }

  async handleConnection(client: Socket) {
    try {
      const cookies = verifyCookies(client.handshake.auth.token);
      if (
        cookies.auth_method === undefined ||
        cookies.token === undefined ||
        cookies.refresh_token === undefined
      ) {
        this.logger_.error("Undefined cookies: ", cookies);
        client.disconnect();
        return
      }
      this.logger_.warn("handleConnection: entrando aquí");
      const userIntra = await this.auth_.getUser(cookies.auth_method, cookies.token, cookies.refresh_token);

      client.data.user = this.chat_.getUserByID(userIntra.id);
      if (client.data.user === undefined) {
        this.logger_.error(`The user ${userIntra.login} (${userIntra.id}) does not appear in the in-memory database of ChatManager.`);
        client.emit('error', `${userIntra.login} not registered.`);
        client.disconnect();
      }
      this.chat_.connectUser(client);
    }
    catch(error) {
      if (error instanceof MissingEnvironmentVariableError)
        console.error(`${error.message}`);
      else if (error instanceof InvalidCookieSignatureError)
        console.error(`${error.message}`);
      else if (error instanceof UserNotFoundError)
        console.error(`${client.data.userID} does not have a created profile yet.`);
      else
        throw error;
    }
  }

  handleDisconnect(client: Socket) {
    const sourceUser = client.data.user;

    if (sourceUser === undefined)
      return;
    this.chat_.disconnectUser(sourceUser);
    this.logger_.debug("Close connection, client id: ", client.id);
  }

  

  /*
  ** WebSocket events handler
  */

  @SubscribeMessage('create')
  onClientCreate(client: Socket, @MessageBody() data: string) {
    const [channelName, password] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.createChannelName(sourceUser, channelName, password ?? undefined);
    let channel: Channel;

    if (response.code === ReturnCode.Allowed) {
      channel = response.data.channel;
      delete response.data.channel;
      response.data.channel = channel.getDetails();
      response.data.users = [] as User[];

      for (const user of channel.getUsers()) {
        const userDetails = user.getDetails();

        if (channel.hasOper(user))
          userDetails.channelRole = UserChannelRole.ADMIN;
        if (channel.owner === user)
          userDetails.channelRole = UserChannelRole.OWNER;
        userDetails.isMuted = channel.hasMuted(user);
        response.data.users.push(userDetails);
      } 
    }
    return JSON.stringify(response);
  }

  @SubscribeMessage('join')
  onClientJoin(client: Socket, @MessageBody() data: string) {
    const [channelUUID, password] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.joinChannelUUID(sourceUser, channelUUID, password ?? undefined);
    let channel: Channel;

    if (response.code === ReturnCode.Allowed) {
      channel = response.data.channel;
      delete response.data.channel;
      response.data.channel = channel.getDetails();
      response.data.users = [] as User[];

      for (const user of channel.getUsers()) {
        const userDetails = user.getDetails();

        if (channel.hasOper(user))
          userDetails.channelRole = UserChannelRole.ADMIN;
        if (channel.owner === user)
          userDetails.channelRole = UserChannelRole.OWNER;
        userDetails.isMuted = channel.hasMuted(user);
        response.data.users.push(userDetails);
      }
    }
    return JSON.stringify(response);
  }

  @SubscribeMessage('close')
  onClientClose(client: Socket, @MessageBody() data: string) {
    const [channelUUID, message] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.forceCloseChannelUUID(sourceUser, channelUUID, message ?? undefined);

    return JSON.stringify(response);
  }

  @SubscribeMessage('part')
  onClientPart(client: Socket, @MessageBody() data: string) {
    const [channelUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.partChannelUUID(sourceUser, channelUUID);

    return JSON.stringify(response);
  }

  @SubscribeMessage('list')
  onClientList(client: Socket) {
    const sourceUser = client.data.user;
    const response = this.chat_.listChannels();

    return JSON.stringify(response);
  }
 
  @SubscribeMessage('kick')
  onClientKick(client: Socket, @MessageBody() data: string) {
    const [channelUUID, targetUserUUID, message] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.kickUserFromChannelUUID(sourceUser, channelUUID, targetUserUUID, message);

    return JSON.stringify(response);
  }

  @SubscribeMessage('ban')
  onClientBan(client: Socket, @MessageBody() data: string) {
    const [channelUUID, targetUserUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.banUserFromChannelUUID(sourceUser, channelUUID, targetUserUUID);

    return JSON.stringify(response);
  }

  @SubscribeMessage('unban')
  onClientUnban(client: Socket, @MessageBody() data: string) {
    const [channelUUID, targetUserUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.unbanUserFromChannelUUID(sourceUser, channelUUID, targetUserUUID);

    return JSON.stringify(response);
  }

  @SubscribeMessage('promote')
  onClientPromote(client: Socket, @MessageBody() data: string) {
    const [channelUUID, targetUserUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.promoteUserInChannelUUID(sourceUser, channelUUID, targetUserUUID);

    return JSON.stringify(response);
  }

  @SubscribeMessage('demote')
  onClientDemote(client: Socket, @MessageBody() data: string) {
    const [channelUUID, targetUserUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.demoteUserInChannelUUID(sourceUser, channelUUID, targetUserUUID);

    return JSON.stringify(response);
  }


  @SubscribeMessage('topic')
  onClientTopic(client: Socket, @MessageBody() data: string) {
    const [channelUUID, topic] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.topicChannelUUID(sourceUser, channelUUID, topic);

    return JSON.stringify(response);
  }

  @SubscribeMessage('password')
  onClientPassword(client: Socket, @MessageBody() data: string) {
    const [channelUUID, password] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.passwordChannelUUID(sourceUser, channelUUID, password);

    return JSON.stringify(response);
  }

  @SubscribeMessage('block')
  handleClientBlock(client: Socket, @MessageBody() data: string): string {
    const [targetUserUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.blockUserUUID(sourceUser, targetUserUUID);

    return JSON.stringify(response);
  }

  @SubscribeMessage('unblock')
  handleClientUnblock(client: Socket, @MessageBody() data: string): string {
    const [targetUserUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.unblockUserUUID(sourceUser, targetUserUUID);

    return JSON.stringify(response);
  }

  @SubscribeMessage('chanmsg')
  onClientChannelMessage(client: Socket, @MessageBody() data: string) {
    const [message, channelUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.messageChannelUUID(sourceUser, channelUUID, message);

    if (response.code === ReturnCode.Allowed)
      console.log("chanmsg:", response.data.messageEvent);
    return JSON.stringify(response);
  }

  @SubscribeMessage('convmsg')
  onClientConversationMessage(client: Socket, @MessageBody() data: string) {
    const [message, targetUserUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.messageConversationUUID(sourceUser, targetUserUUID, message);

    //TODO: Si yo mando un mensaje pero la conversación no se ha creado, se me ha de enviar conversationDetails
    //si ya existe, sólo se enviara messageEventDetails

    response.data.conversationDetails = response.data.conversation.getDetails();
    response.data.messageDetails = response.data.messageEvent.getDetails();

    delete response.data.conversation;
    delete response.data.messageEvent;

    console.log("convmsg:", response);
    return JSON.stringify(response);
  }
  /*
  ** ChatService events handle
  */

  @ChatManagerSubscribe('onUserJoined')
  onUserJoined(event: any): void {
    const userList = event.channel.getUsersExcept(event.sourceUser);
    const userDetails = event.sourceUuser.getDetails();
    const channelDetails = event.channel.getDetails();
    // const channelInfo = {
    //   channel: channelDetails,
    //   users: [] as UserDetails[],
    // }
    const response = {
        channel: { uuid: event.channel.uuid },
        user: userDetails,
    }
    response.user.isMuted = event.channel.hasMuted(event.sourceUser);
    const responseJSON = JSON.stringify(response);

    for (const user of userList) {
        user.socket.emit("join", responseJSON);
    //channelInfo.users.push(item.getDetails());
    }
    //channelInfo.users.push(userDetails);
    //user.socket.emit("join", JSON.stringify(channelInfo))
    this.logger_.debug(`onUserJoined: channel: ${event.channel.name} user: ${event.sourceUser.name}`);
  }

  @ChatManagerSubscribe('onUserConnecting')
  onUserConnecting(event: any): boolean { 
    this.logger_.debug(`onUserConnecting: userID ${event.userID}`);
    return true;
  }

  @ChatManagerSubscribe('onUserConnected')
  onUserConnected(event: any): void {
    this.logger_.debug(`onUserConnected: user ${event.sourceUser.name}`);
  }

  @ChatManagerSubscribe('onUserBlocking')
  onUserBlocking(event: any): void {
    this.logger_.debug(`onUserBlocking: user: ${event.user.name} blocked user: ${event.targetUser.name}`);
  }
}
