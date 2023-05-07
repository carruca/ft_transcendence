import { Socket } from 'socket.io';

/** UTILS *********************************************************************/

export interface Vector2 {
  x: number;
  y: number;
}

/** OPTIONS *******************************************************************/

interface Canvas {
  width: number;
  height: number;
}
export enum Mode {
  NORMAL = 0,
  SPECIAL,
}

export interface Options {
  canvas: Canvas;
  mode: Mode;
  players: number;
  player_pos: Vector2;
  player_scale: Vector2;
  player_speed: Vector2;
  ball_pos: Vector2;
  ball_scale: Vector2;
  ball_speed: Vector2;
  score: number;
}

/** ROOM **********************************************************************/

export enum Axis {
  NONE = 0,
  POS = 1,
  NEG = -1,
}
export interface Axis2 {
  x: Axis,
  y: Axis,
}
export interface Ball {
  pos: Vector2;
  scale: Vector2;
  speed: Vector2;
  dir: Vector2;
  firstTouch: boolean;
}
export interface Player {
  id: number;
  socket: Socket | undefined;
  score: number;
  room: Room;
  ready: boolean;
  pos: Vector2;
  scale: Vector2;
  speed: Vector2;
  axis: Axis2;
}
export enum State {
  WAITING = 0,
  STARTING,
  INGAME,
  END,
}
export interface Room {
  code: string;
  state: State;
  ball: Ball;
  players: Array<Player>;
  spectators: Array<Socket | undefined>;
  options: Options;
}
