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
  Channel,
  User,
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
  EventTypeEnum,
  UserStatusEnum,
  AdminDataTypeEnum,
  AdminObjectTypeEnum,
} from './enum';

import {
  MissingEnvironmentVariableError,
  InvalidCookieSignatureError,
  UserNotFoundError,
} from './error';

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
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
        setTimeout(() => {
          client.disconnect();
        }, 100);
        return;
      }
      const userIntra = await this.auth_.getUser(cookies.auth_method, cookies.token, cookies.refresh_token);
      if (!userIntra) {
        client.emit('reterror',
          JSON.stringify({
          event: 'connection',
          code: 4,
          message: "Service not available",
        }));
        setTimeout(() => {
          client.disconnect();
        }, 500);
        return;
      }
      let sourceUser = this.chat_.getUserByIntraId(userIntra.id);
      if (!sourceUser) {
        const userDB = await this.usersService_.findOneByIntraId(userIntra.id);
        if (!userDB?.nickname) {
          client.disconnect();
        } else {
          sourceUser = this.chat_.addUserDB(userDB);
          if (sourceUser.socket) {
            console.log("joder");
            sourceUser.socket.emit('reterror',
              JSON.stringify({
                event: 'connection',
                code: 4,
                message: "Signed in from another device",
              })
            );
            setTimeout(() => {
              if (sourceUser?.socket)
                sourceUser.socket.disconnect();
            }, 500);
          }
          sourceUser.socket = client;
          client.data.user = sourceUser;
          this.chat_.connectUser(sourceUser);
        }
      } else {
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

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.chat_.disconnectUser(client.data.user);
    }
  }

  /*
  ** WebSocket events handler
  */

  @SubscribeMessage('create')
  async handleClientCreate(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ channelName, password ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.createChannelName(sourceUser, channelName, password);

    response.setSourceUser(sourceUser)
            .setEvent('create')
            .send();
  }

  @SubscribeMessage('join')
  async handleClientJoin(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ channelId, password ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.joinChannelId(sourceUser, channelId, password);

    response.setSourceUser(sourceUser)
            .setEvent('join')
            .send();
  }

  @SubscribeMessage('close')
  async handleClientClose(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ channelId, message ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.closeChannelId(sourceUser, channelId, message);

    response.setSourceUser(sourceUser)
            .setEvent('close')
            .send();
  }

  @SubscribeMessage('part')
  async handleClientPart(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ channelId ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.partChannelId(sourceUser, channelId);

    response.setSourceUser(sourceUser)
            .setEvent('part')
            .send();
  }

  @SubscribeMessage('list')
  async handleClientList(client: Socket): Promise<void> {
    if (!client.data.user) return;

    const sourceUser = client.data.user;
    const response = await this.chat_.summarizeChannels(sourceUser);

    response.setSourceUser(sourceUser)
            .setEvent('list')
            .send();
  }

  @SubscribeMessage('userwatch')
  async handleWatch(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const targetUsersId = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.userWatchUserId(sourceUser, targetUsersId);

    response.setSourceUser(sourceUser)
            .setEvent('userwatch')
            .send();
  }

  @SubscribeMessage('userunwatch')
  async handleUnwatch(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const targetUserId = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.userUnwatchUserId(sourceUser, targetUserId);

    response.setSourceUser(sourceUser)
            .setEvent('userunwatch')
            .send();
  }

  @SubscribeMessage('kick')
  async handleClientKick(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ channelId, targetUserId, message ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.kickUserFromChannelId(sourceUser, channelId, targetUserId, message);

    response.setSourceUser(sourceUser)
            .setEvent('kick')
            .send();
  }

  @SubscribeMessage('ban')
  async handleClientBan(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ channelId, targetUserId ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.banUserFromChannelId(sourceUser, channelId, targetUserId);

    response.setSourceUser(sourceUser)
            .setEvent('ban')
            .send();
  }

  @SubscribeMessage('unban')
  async handleClientUnban(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ channelId, targetUserId ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.unbanUserFromChannelId(sourceUser, channelId, targetUserId);

    response.setSourceUser(sourceUser)
            .setEvent('unban')
            .send();
  }

  @SubscribeMessage('promote')
  async handleClientPromote(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ channelId, targetUserId ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.promoteUserInChannelId(sourceUser, channelId, targetUserId);

    response.setSourceUser(sourceUser)
            .setEvent('promote')
            .send();
  }

  @SubscribeMessage('demote')
  async handleClientDemote(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ channelId, targetUserId ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.demoteUserInChannelId(sourceUser, channelId, targetUserId);

    response.setSourceUser(sourceUser)
            .setEvent('demote')
            .send();
  }

  @SubscribeMessage('siteban')
  async handleClientSiteBan(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ userId ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.siteBanUserId(sourceUser, userId);

    response.setSourceUser(sourceUser)
            .setEvent('siteban')
            .send();
  }


  @SubscribeMessage('siteunban')
  async handleClientSiteUnban(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ userId ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.siteUnbanUserId(sourceUser, userId);

    response.setSourceUser(sourceUser)
            .setEvent('siteunban')
            .send();
  }

  @SubscribeMessage('sitepromote')
  async handleClientSitePromote(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ userId ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.sitePromoteUserId(sourceUser, userId);

    response.setSourceUser(sourceUser)
            .setEvent('sitepromote')
            .send();
  }

  @SubscribeMessage('sitedemote')
  async handleClientSiteDemote(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ userId ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.siteDemoteUserId(sourceUser, userId);

    response.setSourceUser(sourceUser)
            .setEvent('sitedemote')
            .send();
  }

  @SubscribeMessage('topic')
  async handleClientTopic(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ channelId, topic ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.topicChannelId(sourceUser, channelId, topic);

    response.setSourceUser(sourceUser)
            .setEvent('topic')
            .send();
  }

  @SubscribeMessage('password')
  async handleClientPassword(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ channelId, password ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.passwordChannelId(sourceUser, channelId, password);

    response.setSourceUser(sourceUser)
            .setEvent('password')
            .send();
  }

  @SubscribeMessage('block')
  async handleClientBlock(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ targetUserId ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.blockUserId(sourceUser, targetUserId);

    response.setSourceUser(sourceUser)
            .setEvent('block')
            .send();
  }

  @SubscribeMessage('unblock')
  async handleClientUnblock(client: Socket, dataJSON: string): Promise<void>  {
    if (!client.data.user) return;

    const [ targetUserId ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.unblockUserId(sourceUser, targetUserId);

    response.setSourceUser(sourceUser)
            .setEvent('unblock')
            .send();
  }

  @SubscribeMessage('mute')
  async handleClientMute(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ channelId, targetUserId ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.muteUserFromChannelId(sourceUser, channelId, targetUserId);

    response.setSourceUser(sourceUser)
            .setEvent('mute')
            .send();
  }

  @SubscribeMessage('unmute')
  async handleClientUnute(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ channelId, targetUserId ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.unmuteUserFromChannelId(sourceUser, channelId, targetUserId);

    response.setSourceUser(sourceUser)
            .setEvent('unmute')
            .send();
  }

  @SubscribeMessage('challengerequest')
  async handleClientRequestChallenge(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ targetUserId, gameMode ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.requestChallengeUserId(sourceUser, targetUserId, parseInt(gameMode, 10));

    response.setSourceUser(sourceUser)
            .setEvent('challengerequest')
            .send();
  }

  @SubscribeMessage('challengeaccept')
  async handleClientAcceptChallenge(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ targetUserId ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.acceptChallengeUserId(sourceUser, targetUserId);

    response.setSourceUser(sourceUser)
            .setEvent('challengeaccept')
            .send();
  }

  @SubscribeMessage('challengereject')
  async handleRejectChallenge(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ targetUserId ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.rejectChallengeUserId(sourceUser, targetUserId);

    response.setSourceUser(sourceUser)
            .setEvent('challengereject')
            .send();
  }

  @SubscribeMessage('challengespectate')
  async handleChallengeSpectate(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ targetUserId ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.spectateChallengeUserId(sourceUser, targetUserId)

    response.setSourceUser(sourceUser)
            .setEvent('challengespectate')
            .send();
  }

  @SubscribeMessage('chanmsg')
  async onClientChannelMessage(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const [ channelId, message ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.sendMessageChannelId(sourceUser, channelId, message);


    response.setSourceUser(sourceUser)
            .setEvent('chanmsg')
            .send();
  }

  @SubscribeMessage('adminwatch')
  async onClientAdminWatch(client: Socket): Promise<void> {
    if (!client.data.user) return;

    const sourceUser = client.data.user;
    const response = await this.chat_.adminWatch(sourceUser);

    response.setSourceUser(sourceUser)
            .setEvent('adminwatch')
            .send();
  }

  @SubscribeMessage('adminunwatch')
  async onClientAdminUnwatch(client: Socket): Promise<void> {
    if (!client.data.user) return;

    const sourceUser = client.data.user;
    const response = await this.chat_.adminUnwatch(sourceUser);

    response.setSourceUser(sourceUser)
            .setEvent('adminunwatch')
            .send();
  }

  @SubscribeMessage('channelbanlist')
  async onClientChannelBanList(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return;

    const sourceUser = client.data.user;
    const [ channelId ] = JSON.parse(dataJSON);
    const response = await this.chat_.banListChannelId(sourceUser, channelId);

    response.setSourceUser(sourceUser)
            .setEvent('channelbanlist')
            .send();
  }

  @SubscribeMessage('privmsg')
  async onPrivateMessage(client: Socket, dataJSON: string): Promise<void> {
    if (!client.data.user) return

    const [ targetUserId, message ] = JSON.parse(dataJSON);
    const sourceUser = client.data.user;
    const response = await this.chat_.sendMessageUserId(sourceUser, targetUserId, message);

    response.setSourceUser(sourceUser)
            .setEvent('privmsg')
            .send();
  }

  /*
  ** ChatService events handle
  */

  @ChatManagerSubscribe('onUserUnbanned')
  onUseUnbanned(data: any): void {
    const { channel, sourceUser, targetUser } = data;

    if (sourceUser.status !== UserStatusEnum.OFFLINE)
      sourceUser.socket.emit('unBan', JSON.stringify([ channel.id, targetUser.id ]));
  }

  @ChatManagerSubscribe('onUserMessageSended')
  onUserMessageSended(data: any): void {
    const { targetUser, event } = data;

    if (targetUser.status !== UserStatusEnum.OFFLINE)
      targetUser.socket?.emit('privMessage', JSON.stringify([ event.DTO() ]));
  }
 
  @ChatManagerSubscribe('onUserChallengeSpectated')
  onUserChallengeSpectated(event: any): void {
    const { sourceUser, targetUser, gameMode } = event;

    sourceUser.socket?.emit('challengeSpectated', JSON.stringify({ sourceUserId: sourceUser.id, gameMode }));
  }

  @ChatManagerSubscribe('onUserChallengeRequested')
  onUserChallengeRequested(event: any): void {
    const { sourceUser, targetUser, gameMode } = event;

    targetUser.socket?.emit('challengeRequested', JSON.stringify({ sourceUserId: sourceUser.id, gameMode }));
  }

  @ChatManagerSubscribe('onUserChallengeAccepted')
  onUserChallengeAccepted(event: any): void {
    const { sourceUser, targetUser, gameMode } = event;

    targetUser.socket?.emit('challengeAccepted', JSON.stringify({ sourceUserId: sourceUser.id, gameMode }));
    sourceUser.socket?.emit('challengeAccepted', JSON.stringify({ sourceUserId: targetUser.id, gameMode }));
  }

  @ChatManagerSubscribe('onUserChallengeRejected')
  onUserChallengeRejected(event: any): void {
    const { sourceUser, targetUser, gameMode } = event;

    targetUser.socket?.emit('challengeRejected', JSON.stringify({ sourceUserId: sourceUser.id, gameMode }));
  }

  @ChatManagerSubscribe('onUserChannelsSummarized')
  onUserChannelsSummarized(event: any): void {
    const { sourceUser, channelsSummaryDTO } = event;

    sourceUser.socket.emit('list', JSON.stringify(channelsSummaryDTO)); 
  }

  @ChatManagerSubscribe('onUserChannelBanListed')
  onUserChannelBanListed(event: any): void {
    const { sourceUser, channel } = event;
    const banUsers: User[] = [];
    
    for (const user of channel.getBans()) {
      banUsers.push(user.DTO());
    }

    sourceUser.socket.emit('channelBanList', JSON.stringify([ channel.id, banUsers ]));
  }

  @ChatManagerSubscribe('onUserAdminData')
  onUserAdminChannels(event: any): void {
    const { sourceUser, channelsDTO, usersDTO } = event;

    sourceUser.socket.emit('adminData', JSON.stringify([ channelsDTO, usersDTO ]));
  }


  @ChatManagerSubscribe('onUserWatchUser')
  onUserWatchUser(event: any): void {
    const { sourceUser, targetUser } = event;

    //sourceUser.socket.emit('watch', JSON.stringify([ targetUser.DTO() ]));
  }

  @ChatManagerSubscribe('onUserConnected')
  onUserConnected(event: any): void {
    const { sourceUser } = event;
    const sourceUserDTO = sourceUser.DTO();

    sourceUserDTO.channelsDTO = sourceUser.getChannels().map((channel: Channel) => channel.DTO(sourceUser));
    sourceUser.socket.emit('registered', JSON.stringify(sourceUserDTO));

    //this.logger_.debug(`onUserConnected: user ${event.sourceUser.name}`);
  }

  @ChatManagerSubscribe('onUserCreated')
  onUserCreated(data: any): void {
    const { sourceUser, targetUsers } = data;
    const createJSON = JSON.stringify(sourceUser);
   
    for (const targetUser of targetUsers) {
      if (targetUser.socket)
        targetUser.socket.emit('userCreated', JSON.stringify(sourceUser.DTO(targetUser)));
    }

    for (const targetUser of this.chat_.getAdminWatchers()) {
      if (targetUser.socket) {
        targetUser.socket.emit('adminUpdated', JSON.stringify([
          AdminObjectTypeEnum.USER,
          AdminDataTypeEnum.CREATED,
          sourceUser.DTO(targetUser),
        ]));
      }
    }
  }

  @ChatManagerSubscribe('onUserUpdated')
  onUserUpdated(data: any): void {
    const { sourceUser, targetUsers, changes } = data;

    const changesJSON = JSON.stringify({
      sourceUserId: sourceUser.id,
      changes,
    });
    for (const targetUser of targetUsers) {
      if (targetUser.socket)
        targetUser.socket.emit('userUpdated', changesJSON);
    }
    changes.id = sourceUser.id;

    for (const targetUser of this.chat_.getAdminWatchers()) {
      if (targetUser.socket) {
        targetUser.socket.emit('adminUpdated', JSON.stringify([
          AdminObjectTypeEnum.USER,
          AdminDataTypeEnum.UPDATED,
          changes,
        ]));
      }
    }
  }

  @ChatManagerSubscribe('onUserDeleted')
  onUserDeleted(data: any): void {
    const { sourceUser, targetUsers } = data;
    const deleteJSON = JSON.stringify(sourceUser.id);

    for (const targetUser of targetUsers) {
      targetUser.socket?.emit('userDeleted', deleteJSON);
    }

    for (const targetUser of this.chat_.getAdminWatchers()) {
      if (targetUser.socket) {
        targetUser.socket.emit('adminUpdated', JSON.stringify([
          AdminObjectTypeEnum.USER,
          AdminDataTypeEnum.DELETED,
          sourceUser.id,
        ]));
      }
    }
  }

  @ChatManagerSubscribe('onUserJoined')
  onUserJoined(data: any): void {
    const { channel, sourceUser, targetUsers } = data;

    for (const targetUser of targetUsers) {
      targetUser.socket.emit('userJoined', JSON.stringify({
        channelId: channel.id,
        sourceChannelUserDTO: channel.channelUserDTO(sourceUser, targetUser),
      }));
    }

    for (const targetUser of this.chat_.getAdminWatchers()) {
      if (targetUser.socket) {
        targetUser.socket.emit('adminUpdated', JSON.stringify([
          AdminObjectTypeEnum.CHANNEL_USER,
          AdminDataTypeEnum.CREATED,
          channel.channelUserDTO(sourceUser, targetUser),
        ]));
      }
    }
  }

  @ChatManagerSubscribe('onUserParted')
  onUserParted(data: any): void {
    const { channel, sourceUser, targetUsers } = data;
    const partedJSON = JSON.stringify({
      channelId: channel.id,
      sourceUserId: sourceUser.id,
    });

    for (const targetUser of targetUsers) {
      targetUser.socket?.emit('userParted', partedJSON);
    }

    for (const targetUser of this.chat_.getAdminWatchers()) {
      if (targetUser.socket) {
        targetUser.socket.emit('adminUpdated', JSON.stringify([
          AdminObjectTypeEnum.CHANNEL_USER,
          AdminDataTypeEnum.DELETED, {
            channelId: channel.id,
            sourceUserId: sourceUser.id,
          },
        ]));
      }
    }
  }


  @ChatManagerSubscribe('onChannelCreated')
  onChannelCreated(data: any): void {
    const { channel, targetUsers } = data;

    for (const targetUser of targetUsers) {
      targetUser.socket?.emit('channelCreated', JSON.stringify(channel.DTO(targetUser)));
    }
    
    for (const targetUser of this.chat_.getAdminWatchers()) {
      if (targetUser.socket) {
        targetUser.socket.emit('adminUpdated', JSON.stringify([
          AdminObjectTypeEnum.CHANNEL,
          AdminDataTypeEnum.CREATED,
          channel.DTO(targetUser),
        ]));
      }
    }
  }

  @ChatManagerSubscribe('onChannelUpdated')
  onChannelUpdated(data: any): void {
    const { channel, targetUsers, changes } = data;
    const changesJSON = JSON.stringify({
      channelId: channel.id,
      ...changes,
    });

    for (const targetUser of targetUsers) {
      targetUser.socket?.emit('channelUpdated', changesJSON);
    }

    for (const targetUser of this.chat_.getAdminWatchers()) {
      if (targetUser.socket) {
        targetUser.socket.emit('adminUpdated', JSON.stringify([
          AdminObjectTypeEnum.CHANNEL,
          AdminDataTypeEnum.UPDATED, {
            channelId: channel.id,
            ...changes,
          },
        ]));
      }
    }
  }

  @ChatManagerSubscribe('onChannelDeleted')
  onChannelDeleted(data: any): void {
    const { channel, targetUsers } = data;
    const deleteJSON = JSON.stringify(channel.id);

    for (const targetUser of targetUsers) {
      if (targetUser.status !== UserStatusEnum.OFFLINE)
        targetUser.socket.emit('channelDeleted', deleteJSON);
    }

    if (channel.isEmpty) {
      for (const targetUser of this.chat_.getAdminWatchers()) {
        if (targetUser.socket) {
          targetUser.socket.emit('adminUpdated', JSON.stringify([
            AdminObjectTypeEnum.CHANNEL,
            AdminDataTypeEnum.DELETED,
            channel.id,
          ]));
        }
      }
    }
  }

  @ChatManagerSubscribe('onEventCreated')
  onEventCreated(data: any): void {
    const { event, targetUsers } = data;
    const createJSON = JSON.stringify(event)

    for (const targetUser of targetUsers) {
      targetUser.socket?.emit('eventCreated', createJSON);
    }
  }

  @ChatManagerSubscribe('onEventUpdated')
  onEventUpdated(data: any): void {
    const { event, targetUsers, changes } = data;

    changes.id = event.id;
    changes.channelId = event.channel.id;
    const changesJSON = JSON.stringify(changes);

    for (const targetUser of targetUsers) {
      targetUser.socket?.emit('eventUpdated', changesJSON);
    }
  }

  @ChatManagerSubscribe('onChannelEventCreated')
  onChannelEventCreated(data: any): void {
    const { channel, event, targetUsers } = data;

    const changesJSON = JSON.stringify({
      channelId: channel.id,
      eventDTO: event.DTO(),
    });

    for (const targetUser of targetUsers) {
      if (!targetUser.hasBlocked(event.sourceUser))
        targetUser.socket?.emit('channelEventCreated', changesJSON);
    }
  }
}
