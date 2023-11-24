import {
  AuthService,
} from '../auth/auth.service';

import {
  UsersService,
} from '../users/users.service';

import {
  ChatManager,
} from './manager';

import {
  ChannelModel as Channel,
  UserModel as User,
} from './model';

import {
  ChatManagerHandler,
  ChatManagerInstance,
  ChatManagerSubscribe,
} from './decorator';

import {
  verifyCookies
} from './util';

import {
  ReturnCodeEnum,
} from './enum';

import {
  ReturnMessage,
} from './return-messages';

import {
  MissingEnvironmentVariableError,
  InvalidCookieSignatureError,
  UserNotFoundError,
} from './error';

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';

import {
  Server,
  Socket,
} from 'socket.io';

import {
  Logger,
  Injectable,
} from '@nestjs/common';

import {
  Request,
  Response,
  NextFunction,
} from 'express';

import {
  v4 as uuidv4,
} from 'uuid';

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

  async handleDisconnect(client: Socket) {
    if (client.data.user)
      this.chat_.disconnectUser(client.data.user);
  }

  private replyToClient_(client: Socket, event: string, response: ReturnMessage) {
    if (response.code === ReturnCodeEnum.ALLOWED) {
      client.emit(event, JSON.stringify(response));
    } else if (response.code !== ReturnCodeEnum.NOTHING_HAPPENED) {
      client.emit('reterr', JSON.stringify(response));
    }
  }

  /*
  ** WebSocket events handler
  */

  @SubscribeMessage('create')
  async handleClientCreate(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return

    const [ channelName, password ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.createChannelName(sourceUser, channelName, password);

    response.setSourceUser(sourceUser)
            .setEvent('create')
            .send();
  }

  @SubscribeMessage('join')
  async handleClientJoin(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return

    const [ channelUUID, password ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.joinChannelUUID(sourceUser, channelUUID, password);

    response.setSourceUser(sourceUser)
            .setEvent('join')
            .send();
  }

  @SubscribeMessage('close')
  async handleClientClose(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return

    const [ channelUUID, message ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.closeChannelUUID(sourceUser, channelUUID, message);

    response.setSourceUser(sourceUser)
            .setEvent('close')
            .send();
  }

  @SubscribeMessage('part')
  async handleClientPart(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return

    const [ channelUUID ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.partChannelUUID(sourceUser, channelUUID);

    response.setSourceUser(sourceUser)
            .setEvent('part')
            .send();
  }

  @SubscribeMessage('list')
  async handleClientList(client: Socket): Promise<void> {
    if (!client.data.user) return

    const sourceUser = client.data.user;
    const response = await this.chat_.summarizeChannels(sourceUser);

    response.setSourceUser(sourceUser)
            .setEvent('part')
            .send();
  }
 
  @SubscribeMessage('kick')
  async handleClientKick(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return

    const [ channelUUID, targetUserUUID, message ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.kickUserFromChannelUUID(sourceUser, channelUUID, targetUserUUID, message);

    response.setSourceUser(sourceUser)
            .setEvent('part')
            .send();
  }

  @SubscribeMessage('ban')
  async handleClientBan(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return

    const [ channelUUID, targetUserUUID ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.banUserFromChannelUUID(sourceUser, channelUUID, targetUserUUID);

    response.setSourceUser(sourceUser)
            .setEvent('ban')
            .send();
  }

  @SubscribeMessage('unban')
  async handleClientUnban(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return

    const [ channelUUID, targetUserUUID ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.unbanUserFromChannelUUID(sourceUser, channelUUID, targetUserUUID);

    response.setSourceUser(sourceUser)
            .setEvent('uban')
            .send();
  }

  @SubscribeMessage('promote')
  async handleClientPromote(client: Socket, data: string): Promise<void> {
    if (!client.data.user) return

    const [ channelUUID, targetUserUUID ] = data;
    const sourceUser = client.data.user;
    const response = await this.chat_.promoteUserInChannelUUID(sourceUser, channelUUID, targetUserUUID);

    response.setSourceUser(sourceUser)
            .setEvent('promote')
            .send();
  }

  @SubscribeMessage('demote')
  async handleClientDemote(client: Socket, data: string): Promise<void> {
    if (!client.data.user) return

    const [ channelUUID, targetUserUUID ] = data;
    const sourceUser = client.data.user;
    const response = await this.chat_.demoteUserInChannelUUID(sourceUser, channelUUID, targetUserUUID);

    response.setSourceUser(sourceUser)
            .setEvent('demote')
            .send();
  }


  @SubscribeMessage('topic')
  async handleClientTopic(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return

    const [ channelUUID, topic ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.topicChannelUUID(sourceUser, channelUUID, topic);

    response.setSourceUser(sourceUser)
            .setEvent('topic')
            .send();
  }

  @SubscribeMessage('password')
  async handleClientPassword(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return

    const [ channelUUID, password ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.passwordChannelUUID(sourceUser, channelUUID, password);

    response.setSourceUser(sourceUser)
            .setEvent('password')
            .send();
  }

  @SubscribeMessage('block')
  async handleClientBlock(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ targetUserUUID ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.blockUserUUID(sourceUser, targetUserUUID);

    response.setSourceUser(sourceUser)
            .setEvent('block')
            .send();
  }

  @SubscribeMessage('unblock')
  async handleClientUnblock(client: Socket, dataJSON: string): Promise<void>  {
    if (!client.data.user) return

    const [ targetUserUUID ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.unblockUserUUID(sourceUser, targetUserUUID);

    response.setSourceUser(sourceUser)
            .setEvent('unblock')
            .send();
  }

  @SubscribeMessage('challengerequest')
  async handleClientRequestChallenge(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return

    const [ targetUserUUID, gameMode ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.requestChallengeUserUUID(sourceUser, targetUserUUID, parseInt(gameMode, 10));

    response.setSourceUser(sourceUser)
            .setEvent('challengerequest')
            .send();
  }

  @SubscribeMessage('challengeaccept')
  async handleClientAcceptChallenge(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return

    const [ targetUserUUID ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.acceptChallengeUserUUID(sourceUser, targetUserUUID);

    response.setSourceUser(sourceUser)
            .setEvent('challengeaccept')
            .send();
  }

  @SubscribeMessage('challengereject')
  async handleRejectChallenge(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return

    const [ targetUserUUID ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.rejectChallengeUserUUID(sourceUser, targetUserUUID);

    response.setSourceUser(sourceUser)
            .setEvent('challengereject')
            .send();
  }

  @SubscribeMessage('userobserve')
  async handleObserveUser(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return

    const [ targetUserUUID ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.observeUserUUID(sourceUser, targetUserUUID)
 
    response.setSourceUser(sourceUser)
            .setEvent('userobserve')
            .send();
  }

  @SubscribeMessage('chanmsg')
  async onClientChannelMessage(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return

    const [ channelUUID, message ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.messageChannelUUID(sourceUser, channelUUID, message);


    response.setSourceUser(sourceUser)
            .setEvent('chanmsg')
            .send();
    /*
    if (response.code === ReturnCodeEnum.ALLOWED)
      console.log("chanmsg:", response.data.messageEvent);
      */
  }

  /*
  @SubscribeMessage('convmsg')
  async onClientConversationMessage(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return

    const [ targetUserUUID, message ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.messageConversationUUID(sourceUser, targetUserUUID, message);

    //TODO: Si yo mando un mensaje pero la conversación no se ha creado, se me ha de enviar conversationDetails
    //si ya existe, sólo se enviara messageEventDetails

    response.data.conversationDetails = response.data.conversation.getDTO();
    response.data.messageDetails = response.data.messageEvent.getDTO();

    delete response.data.conversation;
    delete response.data.messageEvent;

    console.log("convmsg:", response);
  }
  */
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
    const { sourceUser } = event;
    const sourceUserDTO = sourceUser.DTO;
    sourceUserDTO.channels = sourceUser.getChannels().map((channel: Channel) => channel.DTO);

    console.log("onUserConnected:", sourceUserDTO);
    sourceUser.socket.emit('registered', JSON.stringify(sourceUserDTO));

    //this.logger_.debug(`onUserConnected: user ${event.sourceUser.name}`);
  }

  @ChatManagerSubscribe('onUserBlocking')
  onUserBlocking(event: any): void {
    this.logger_.debug(`onUserBlocking: user: ${event.user.name} blocked user: ${event.targetUser.name}`);
  }
}
