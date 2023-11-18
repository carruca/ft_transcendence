import { AuthService } from '../auth/auth.service';
import { ChatManager } from './managers';
import { ChannelModel as Channel, UserModel as User } from './models';
import { ChatManagerHandler, ChatManagerInstance, ChatManagerSubscribe } from './decorators';
import { verifyCookies } from './utils';
import { UserChannelRole, ReturnCode } from './enums';

import { MissingEnvironmentVariableError, InvalidCookieSignatureError, UserNotFoundError } from './errors';

import { UsersService } from '../users/users.service';

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

  constructor(
    chat: ChatManager,
    private readonly auth_: AuthService,
    private readonly usersService_: UsersService,
  ) {
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
        this.logger_.error(`Undefined cookies: ${cookies}`);
        setTimeout(() => {
          client.disconnect();
        }, 100);
        return;
      }
      const userIntra = await this.auth_.getUser(cookies.auth_method, cookies.token, cookies.refresh_token);
      let sourceUser = this.chat_.getUserByID(userIntra.id);
      if (!sourceUser) {
        const userDB = await this.usersService_.findOneByIntraId(userIntra.id); 
        if (!userDB?.nickname) {
          this.logger_.warn(`The user ${userIntra.login} (${userIntra.id}) does not appear in the in-memory database of ChatManager.`);
          client.emit('error', `${userIntra.login} not registered.`);
          client.disconnect();
        } else {
          sourceUser = this.chat_.addUserDB(userDB);
          sourceUser.socket = client;
          client.data.user = sourceUser;
          this.logger_.log("Usuario registrado en la DB. Copiando a memoria.");
          this.chat_.connectUser(sourceUser);
        }
      } else {
        this.logger_.log("Usuario en memoria.");
        sourceUser.socket = client;
        client.data.user = sourceUser;
        this.chat_.connectUser(sourceUser);
      }
    } catch(error) {
      if (error instanceof MissingEnvironmentVariableError)
        console.error(`${error.message}`);
      else if (error instanceof InvalidCookieSignatureError)
        console.error(`${error.message}`);
      //else if (error instanceof UserNotFoundError)
        //console.error(`${client.datio.intraID} does not have a created profile yet.`);
      
      else
        throw error;
    }
  }

  /*
  handleConnection1(client: Socket) {
    try {
      const cookies = verifyCookies(client.handshake.auth.token);
      if (
        cookies.auth_method === undefined ||
        cookies.token === undefined ||
        cookies.refresh_token === undefined
      ) {
        this.logger_.error(`Undefined cookies: ${cookies}`);
        // When attempting to disconnect the socket within the handleConnection
        // event, the socket doesn't disconnect as expected, hence the need to
        // introduce a deliberate delay.
        setTimeout(() => {
          client.disconnect();
        }, 100);
        return;
      }
      //const userIntra = await this.auth_.getUser(cookies.auth_method, cookies.token, cookies.refresh_token);
      this.auth_.getUser(cookies.auth_method, cookies.token, cookies.refresh_token).then((userIntra) => {
        let sourceUser = this.chat_.getUserByID(userIntra.id);
        if (sourceUser === undefined) {
          this.usersService_.findOneByIntraId(userIntra.id).then((userDB) => {

            if (!userDB || !userDB.nickname) {
            //console.log("dbuser ", userDB.nickname);
              this.logger_.error(`The user ${userIntra.login} (${userIntra.id}) does not appear in the in-memory database of ChatManager.`);
              client.emit('error', `${userIntra.login} not registered.`);
              client.disconnect();
            } else {
              sourceUser = this.chat_.addUserDB(userDB);
              sourceUser.socket = client;
              client.data.user = sourceUser;
              this.logger_.log("Usuario registrado en la DB. Copiando a memoria.");
              this.chat_.connectUser(sourceUser);
            }
          });
        } else {
          this.logger_.log("Usuario en memoria.");
          sourceUser.socket = client;
          client.data.user = sourceUser;
          this.chat_.connectUser(sourceUser);
        }
      });
    }
    catch(error) {
      if (error instanceof MissingEnvironmentVariableError)
        console.error(`${error.message}`);
      else if (error instanceof InvalidCookieSignatureError)
        console.error(`${error.message}`);
      //else if (error instanceof UserNotFoundError)
        //console.error(`${client.datio.intraID} does not have a created profile yet.`);
      
      else
        throw error;
    }
  }
*/
  handleDisconnect(client: Socket) {
    const sourceUser = client.data.user;

    if (sourceUser === undefined) {
      this.logger_.warn("Unregistered user disconnected.");
      return;
    }
    this.chat_.disconnectUser(sourceUser);
  }

  /*
  ** WebSocket events handler
  */

  @SubscribeMessage('create')
  async onClientCreate(client: Socket, data: string) {
    const [channelName, password] = JSON.parse(data);
    const sourceUser = client.data.user;
    const response = await this.chat_.createChannelName(sourceUser, channelName, password);

    if (response.code != ReturnCode.Allowed) {
      client.emit('reterr', JSON.stringify(response));
    } else {
      client.emit('create', JSON.stringify(response));
    }
  }

  @SubscribeMessage('join')
  onClientJoin(client: Socket, data: string) {
    const [channelUUID, password] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.joinChannelUUID(sourceUser, channelUUID, password);

    return JSON.stringify(response);
  }

  @SubscribeMessage('close')
  onClientClose(client: Socket, data: string) {
    const [channelUUID, message] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.forceCloseChannelUUID(sourceUser, channelUUID, message ?? undefined);

    return JSON.stringify(response);
  }

  @SubscribeMessage('part')
  onClientPart(client: Socket, data: string) {
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
  onClientKick(client: Socket, data: string) {
    const [channelUUID, targetUserUUID, message] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.kickUserFromChannelUUID(sourceUser, channelUUID, targetUserUUID, message);

    return JSON.stringify(response);
  }

  @SubscribeMessage('ban')
  onClientBan(client: Socket, data: string) {
    const [channelUUID, targetUserUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.banUserFromChannelUUID(sourceUser, channelUUID, targetUserUUID);

    return JSON.stringify(response);
  }

  @SubscribeMessage('unban')
  onClientUnban(client: Socket, data: string) {
    const [channelUUID, targetUserUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.unbanUserFromChannelUUID(sourceUser, channelUUID, targetUserUUID);

    return JSON.stringify(response);
  }

  @SubscribeMessage('promote')
  onClientPromote(client: Socket, data: string) {
    const [channelUUID, targetUserUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.promoteUserInChannelUUID(sourceUser, channelUUID, targetUserUUID);

    return JSON.stringify(response);
  }

  @SubscribeMessage('demote')
  onClientDemote(client: Socket, data: string) {
    const [channelUUID, targetUserUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.demoteUserInChannelUUID(sourceUser, channelUUID, targetUserUUID);

    return JSON.stringify(response);
  }


  @SubscribeMessage('topic')
  onClientTopic(client: Socket, data: string) {
    const [channelUUID, topic] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.topicChannelUUID(sourceUser, channelUUID, topic);

    return JSON.stringify(response);
  }

  @SubscribeMessage('password')
  onClientPassword(client: Socket, data: string) {
    const [channelUUID, password] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.passwordChannelUUID(sourceUser, channelUUID, password);

    return JSON.stringify(response);
  }

  @SubscribeMessage('block')
  handleClientBlock(client: Socket, data: string): string {
    const [targetUserUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.blockUserUUID(sourceUser, targetUserUUID);

    return JSON.stringify(response);
  }

  @SubscribeMessage('unblock')
  handleClientUnblock(client: Socket, data: string): string {
    const [targetUserUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.unblockUserUUID(sourceUser, targetUserUUID);

    return JSON.stringify(response);
  }

  @SubscribeMessage('challenge')
  handleClientChallenge(client: Socket, data: string): string {
    const [targetUserUUID, gameMode] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.requestChallengeUserUUID(sourceUser, targetUserUUID, parseInt(gameMode, 10));

    return JSON.stringify(response);
  }

  @SubscribeMessage('challengeaccept')
  handleClientAcceptChallenge(client: Socket, data: string): string {
    const [targetUserUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.acceptChallengeUserUUID(sourceUser, targetUserUUID);

    return JSON.stringify(response);
  }

  @SubscribeMessage('challengereject')
  handleRejectChallenge(client: Socket, data: string): string {
    const [targetUserUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.rejectChallengeUserUUID(sourceUser, targetUserUUID);

    return JSON.stringify(response);
  }

  @SubscribeMessage('chanmsg')
  onClientChannelMessage(client: Socket, data: string) {
    const [message, channelUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.messageChannelUUID(sourceUser, channelUUID, message);

    if (response.code === ReturnCode.Allowed)
      console.log("chanmsg:", response.data.messageEvent);
    return JSON.stringify(response);
  }

  @SubscribeMessage('convmsg')
  onClientConversationMessage(client: Socket, data: string) {
    const [message, targetUserUUID] = data;
    const sourceUser = client.data.user;
    const response = this.chat_.messageConversationUUID(sourceUser, targetUserUUID, message);

    //TODO: Si yo mando un mensaje pero la conversación no se ha creado, se me ha de enviar conversationDetails
    //si ya existe, sólo se enviara messageEventDetails

    response.data.conversationDetails = response.data.conversation.getDTO();
    response.data.messageDetails = response.data.messageEvent.getDTO();

    delete response.data.conversation;
    delete response.data.messageEvent;

    console.log("convmsg:", response);
    return JSON.stringify(response);
  }
  /*
  ** ChatService events handle
  */

  //TODO: A eliminar
  @ChatManagerSubscribe('test')
  async onTest(events: any): Promise<boolean> {
    console.log("Inicio de test");

    await new Promise((resolve)  => {
      setTimeout(() => {
        console.log("Se ha realizado la espera.");
        resolve(false); // Resuelve la promesa después de la espera.
      }, 5000);
    });

    console.log("Fin de test");
    return true;
  }

  @ChatManagerSubscribe('onUserChallengeRequest')
  onUserChallengeRequest(event: any): void {
    event.targetUser.socket.emit('challengerequest', event.sourceUser.uuid, event.gameMode);
  }

  @ChatManagerSubscribe('onUserChallengeAccepted')
  onUserChallengeAccepted(event: any): void {
    event.sourceUser.socket.emit('challengeaccepted', event.targetUser.uuid, event.gameMode);
  }

  @ChatManagerSubscribe('onUserChallengeRejected')
  onUserChallengeRejected(event: any): void {
    event.sourceUser.socket.emit('challengerejected', event.targetUser.uuid, event.gameMode);
  }


  @ChatManagerSubscribe('onUserNickChanged')
  onUserNickChanged(event: any): void {
    const users = event.sourceUser.getWatchers();
    const response = {
      userUUID: event.sourceUser.uuid,
      name: event.sourceUser.name,
      status: event.sourceUser.status,
      siteRole: event.sourceUser.siteRole,
    };
    const responseJSON = JSON.stringify(response);

    for (const user of users) {
      user.socket.emit('update', responseJSON);
    }
  }

  @ChatManagerSubscribe('onUserJoined')
  onUserJoined(event: any): void {
    const userList = event.channel.getUsersExcept(event.sourceUser);
    const userView = event.sourceUser.getViewModel();
    const channelView = event.channel.getViewModel();
    // const channelInfo = {
    //   channel: channelDetails,
    //   users: [] as UserDetails[],
    // }
    const response = {
        channel: { uuid: event.channel.uuid },
        user: userView,
    }
    response.user.isMuted = event.channel.hasMuted(event.sourceUser);
    const responseJSON = JSON.stringify(response);

    for (const user of userList) {
        user.socket.emit("join", responseJSON);
    //channelInfo.users.push(item.getDTO());
    }
    //channelInfo.users.push(userDetails);
    //user.socket.emit("join", JSON.stringify(channelInfo))
    this.logger_.debug(`onUserJoined: channel: ${event.channel.name} user: ${event.sourceUser.name}`);
  }

  @ChatManagerSubscribe('onUserConnected')
  onUserConnected(event: any): void {
    //this.logger_.debug(`onUserConnected: user ${event.sourceUser.name}`);
  }

  @ChatManagerSubscribe('onUserBlocking')
  onUserBlocking(event: any): void {
    this.logger_.debug(`onUserBlocking: user: ${event.user.name} blocked user: ${event.targetUser.name}`);
  }
}
