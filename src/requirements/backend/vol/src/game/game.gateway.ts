import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Server } from 'net';

import { Axis, Axis2, Player, Room } from './game.interface';
import { RoomService } from './room.service';
import { ChatManagerHandler, ChatManagerSubscribe, ChatManagerInstance } from '../chat/decorator';
import { ChatManager } from '../chat/manager';

@WebSocketGateway({
  cors: {
    origin: process.env.NEST_FRONT_URL
  },
})
@ChatManagerHandler()
export class GameGateway implements OnGatewayDisconnect {
  @ChatManagerInstance()
  private chat_manager: ChatManager;
  //nicknames: Map<string, string> = new Map();
  constructor(
    private room_service: RoomService,
    chat_manager: ChatManager,
  ) {
    this.chat_manager = chat_manager;
  }

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log("CONNECTION: " + client.id);
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.room_service.disconnect(client);
    }
    console.log("DISCONNECTION: " + client.id);
  }

  @SubscribeMessage('join_queue')
  join_queue(client: Socket, mode: string): void {
    if (!client.data.user) {
      client.emit('error_queue');
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
    const player: Player | null = this.room_service.get_player(client.data.user.uuid);
    if (!player)
      return;
    this.room_service.ready(player);
  }

  @SubscribeMessage('get-room')
  get_room(client: Socket, uuid: string): void {
    const room: Room | null = this.room_service.get_user_roomcode(uuid);
    if (room !== null) {
      client.emit('room', room.code);
    }
  }

  @SubscribeMessage('new-room')
  new_room(client: Socket, mode: string) {
    if (!client.data.user)
      return;
    let room: Room | undefined = this.room_service.new_room(mode);
    if (room === undefined) return;
    this.room_service.join_room(room, client);
    // TODO emit room code back to the player so it can invite new players, or let the other one use the get-room endpoint
  }

  @SubscribeMessage('join-room')
  join_room(client: Socket, code: string) {
    if (!client.data.user)
      return;
    let room: Room | undefined = this.room_service.get_room(code);
    if (room === undefined) return;
    this.room_service.join_room(room, client);
  }

  @SubscribeMessage('down')
  keyPress(client: Socket, key: string): void {
    const player: Player | null = this.room_service.get_player(client.data.user.uuid);
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
    const player: Player | null = this.room_service.get_player(client.data.user.uuid);
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

  @ChatManagerSubscribe('onUserChallengeAccepted')
  onUserChallengeAccepted(event: any): void {
    console.log(`onUserChallengeAccepted: source ${event.sourceUser.uuid} | target ${event.targetUser.uuid} | mode ${event.mode}`);
  }
}
