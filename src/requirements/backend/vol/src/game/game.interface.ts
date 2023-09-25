import { Socket } from 'socket.io';

import { UserStats, CreateMatchDto } from '../matches/dto/create-match.dto';

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
  mode_name: string;
  players: number;
  player_pos: Vector2;
  player_scale: Vector2;
  player_speed: Vector2;
  ball_pos: Vector2;
  ball_scale: Vector2;
  ball_speed: Vector2;
  score: number;
}

/** STATS *********************************************************************/

export interface Stats {
  score: number;
  rival_score: number;
  come_back: boolean; // come back from 3 points difference
  double_tap: number; // score 2 consecutive points in less than 5 seconds
  blocker: number; // block 10 consecutive shoots from the rival
  streak: boolean; // score N consecutive points (N == winning points)
  first_point: boolean; // score the first point
  precision: number; // score a point from the corner
}

/** ROOM **********************************************************************/

export enum Axis {
  NONE = 0,
  POS = 1,
  NEG = -1,
}
export interface Axis2 {
  x: Axis;
  y: Axis;
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
  room: Room;
  ready: boolean;
  pos: Vector2;
  scale: Vector2;
  speed: Vector2;
  axis: Axis2;
  stats: Stats;
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
  start: Date;
}
