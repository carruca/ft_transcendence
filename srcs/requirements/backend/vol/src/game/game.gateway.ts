import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Server } from 'net';

import { Axis, Axis2, Player, Room, Mode } from './game.interface';
import { RoomService } from './room.service';
import { ChatManagerHandler, ChatManagerSubscribe, ChatManagerInstance } from '../chat/decorator';
import { ChatManager } from '../chat/manager';
import { UserStatusEnum } from '../chat/enum';

import { EventType } from './enum';

@ChatManagerHandler()
@WebSocketGateway({
  cors: {
    origin: process.env.NEST_FRONT_URL
  },
})
export class GameGateway implements OnGatewayDisconnect {

  @ChatManagerInstance()
  private chat_manager: ChatManager;
  //nicknames: Map<string, string> = new Map();

  private eventQueue: Map<string, { eventType: EventType, data: any, timeout: ReturnType<typeof setTimeout> }> = new Map();

  constructor(
    private room_service: RoomService,
    chat_manager: ChatManager,
  ) {
    this.chat_manager = chat_manager;
  }

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    //console.log("CONNECTION: " + client.id);
  }

  handleDisconnect(client: Socket) {
    if (!client.data.user) {
      return;
    }
    this.room_service.disconnect(client);
    //console.log("DISCONNECTION: " + client.id);
  }

  // Emited when client changes page
  @SubscribeMessage('leave')
  leave(client: Socket): void {
    if (!client.data.user)
      return;
    this.room_service.disconnect(client);
    this.room_service.change_user_status(client, UserStatusEnum.ONLINE);
  }

  @SubscribeMessage('leave_game')
  leave_game(client: Socket): void {
    if (!client.data.user)
      return;
    this.room_service.disconnect(client);
    this.room_service.change_user_status(client, UserStatusEnum.ONLINE);
  }

  @SubscribeMessage('join_queue')
  join_queue(client: Socket, mode: string): void {
    if (!client.data.user) {
      client.emit('error_auth');
      return;
    }
    this.room_service.join_queue(client, mode);
  }

  @SubscribeMessage('leave_queue')
  leave_queue(client: Socket): void {
    if (!client.data.user)
      return;
    this.room_service.leave_queue(client);
  }

  @SubscribeMessage('ready')
  onReady(client: Socket): void {
    if (!client.data.user)
      return;
    const player: Player | null = this.room_service.get_player(client.data.user.id);
    if (!player)
      return;
    this.room_service.ready(player);
  }

  @SubscribeMessage('menu')
  onMenu(client: Socket): void {
    if (!client.data.user)
      return;
    // Set user status to online when on menu
    // (in case it exited erroneously and didn't change on room.stop())
    client.data.user.status = UserStatusEnum.ONLINE;
  }

  @SubscribeMessage('down')
  keyPress(client: Socket, key: string): void {
    const player: Player | null = this.room_service.get_player(client.data.user.id);
    if (player === null) return;
    let axis: Axis2 = player.axis;

    if (key === "w" || key === "," || key === "arrowup") {
      axis.y = Axis.NEG;
    } else if (key === "s" || key === "o" || key === "arrowdown") {
      axis.y = Axis.POS;
    } else if (key === "a" || key === "arrowleft") {
      axis.x = Axis.NEG;
    } else if (key === "d" || key === "e" || key === "arrowright") {
      axis.x = Axis.POS;
    }
  }

  @SubscribeMessage('up')
  keyRelease(client: Socket, key: string): void {
    const player: Player | null = this.room_service.get_player(client.data.user.id);
    if (player === null) return;
    let axis: Axis2 = player.axis;
    if (key === "w" || key === "," || key === "arrowup") {
      if (axis.y === Axis.NEG) {
        axis.y = Axis.NONE;
      }
    } else if (key === "s" || key === "o" || key === "arrowdown") {
      if (axis.y === Axis.POS) {
        axis.y = Axis.NONE;
      }
    } else if (key === "a" || key === "arrowleft") {
      if (axis.x === Axis.NEG) {
        axis.x = Axis.NONE;
      }
    } else if (key === "d" || key === "e" || key === "arrowright") {
      if (axis.x === Axis.POS) {
        axis.x = Axis.NONE;
      }
    }
  }

  // EVENTS

  queueEvent(userId: string, eventType: EventType, data: any) {
    const existingEvent = this.eventQueue.get(userId);
    if (existingEvent) {
      clearTimeout(existingEvent.timeout);
    }
  
    const timeout = setTimeout(() => {
      this.eventQueue.delete(userId);
    }, 60000); // 60 seconds expiry
  
    this.eventQueue.set(userId, { eventType, data, timeout });
    console.log("Event queued: " + eventType);
  }
  processPendingEvent(client: Socket) {
    const userId = client.data.user?.id;
    if (!userId) {
      return;
    }
  
    const queuedEvent = this.eventQueue.get(userId);
    if (queuedEvent) {
      switch (queuedEvent.eventType) {
        case EventType.Challenge:
          console.log("Processed challenge event for: " + client.data.user?.nickname);
          // User can accept challenge while in queue so we need to leave queue first
          this.room_service.leave_queue(client);
          // User can accapt challenge while in room
          this.room_service.disconnect(client);

          this.room_service.join_room(queuedEvent.data.room, client);
          break;
        case EventType.Spectate:
          console.log("Processed spectate event for: " + client.data.user?.nickname);
          this.room_service.join_room(queuedEvent.data.room, client);
          break;
      }
      clearTimeout(queuedEvent.timeout);
      this.eventQueue.delete(userId);
    }
  }

  @SubscribeMessage('events')
  handleEvents(client: Socket): void {
    if (!client.data.user)
      return;
    this.processPendingEvent(client);
  }

  @ChatManagerSubscribe('onUserChallengeAccepted')
  onUserChallengeAccepted(event: any): void {
    console.log("onUserChallengeAccepted");
    const room: Room | undefined = this.room_service.new_room("normal");
    if (room === undefined) return;

    this.queueEvent(event.sourceUser.id, EventType.Challenge, { room });
    this.queueEvent(event.targetUser.id, EventType.Challenge, { room });

    event.sourceUser.socket.emit('events-dispatch');
    event.targetUser.socket.emit('events-dispatch');
  }
  @ChatManagerSubscribe('onUserChallengeSpectated')
  onUserChallengeSpectated(event: any): void {
    const roomcode: string | null = this.room_service.get_user_roomcode(event.targetUser.id);
    if (roomcode === null) return;
    const room: Room | undefined = this.room_service.get_room(roomcode);
    if (room === undefined) return;

    this.queueEvent(event.sourceUser.id, EventType.Spectate, { room });

    event.sourceUser.socket.emit('events-dispatch');
  }
  @ChatManagerSubscribe('onUserConnected')
  onUserConnected(event: any): void {
    this.processPendingEvent(event.sourceUser.socket);
  }
}
