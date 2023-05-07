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

@WebSocketGateway({
  cors: {
    // TODO change to ENV var -> process.env.FRONTEND
    origin: process.env.NEST_FRONT_URL
  },
})

export class GameGateway implements OnGatewayDisconnect {
  //nicknames: Map<string, string> = new Map();
  constructor(
    private room_service: RoomService,
  ) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // TODO get user
    // TODO set client.data.user to user
    console.log("CONNECTION: " + client.id);
  }

  handleDisconnect(client: Socket) {
    // TODO check if (client.data.user != null) to know if it was connected successfully
    this.room_service.disconnect(client);
    console.log("DISCONNECTION: " + client.id);
  }

  @SubscribeMessage('join_queue')
  join_queue(client: Socket, mode: string): void {
    // TODO check if auth (client.data.user != null)
    this.room_service.join_queue(client, mode);
  }

  @SubscribeMessage('leave_queue')
  leave_queue(client: Socket): void {
    // TODO check if auth (client.data.user != null)
    this.room_service.leave_queue(client);
  }

  @SubscribeMessage('ready')
  onReady(client: Socket): void {
    // TODO check if auth (client.data.user != null)

    // TODO check with user id -> !this.room.get_player(client.data.user.id
    const player: Player | null = this.room_service.get_player(client.id);

    this.room_service.ready(player);
  }

  @SubscribeMessage('get-room')
  get_room(client: Socket, id: string): void {
    const room: Room | null = this.room_service.get_user_roomcode(id);
    if (room !== null) {
      client.emit('room', room.code);
    }
  }

  @SubscribeMessage('new-room')
  new_room(client: Socket, mode: string) {
    // TODO check if auth (client.data.user != null)

    let room: Room | undefined = this.room_service.new_room(mode);
    if (room === undefined) return;
    this.room_service.join_room(room, client);
    // TODO emit room code back to the player so it can invite new players, or let the other one use the get-room endpoint
  }

  @SubscribeMessage('join-room')
  join_room(client: Socket, code: string) {
    // TODO check if auth (client.data.user != null)

    let room: Room | undefined = this.room_service.get_room(code);
    if (room === undefined) return;
    this.room_service.join_room(room, client);
  }

  @SubscribeMessage('down')
  keyPress(client: Socket, key: string): void {
    const player: Player | null = this.room_service.get_player(client.id);
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
    const player: Player | null = this.room_service.get_player(client.id);
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
}
