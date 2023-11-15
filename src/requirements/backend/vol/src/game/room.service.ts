import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Interval } from '@nestjs/schedule';

import { Mode, Options, Axis, Player, State, Room } from './game.interface';
import { GameService } from './game.service';

import { UserStats, CreateMatchDto } from '../matches/dto/create-match.dto';
import { MatchesService } from '../matches/matches.service';

import { AchievementsService } from '../achievements/achievements.service';

const WIDTH = 858;
const HEIGHT = 525;

const modes: Map<string, number> = new Map([
  ['normal', 2],
  ['special', 4],
]);
const isValidMode = (mode: string): boolean => {
  return modes.has(mode);
};

@Injectable()
export class RoomService {
  constructor(
    private readonly game: GameService,
    private readonly matches: MatchesService,
    private readonly achievementsService: AchievementsService,
  ) {}

  //queue: Array<Socket | undefined> = [];
  queue: Map<string, Array<Socket | undefined>> = new Map();
  rooms: Map<string, Room> = new Map();

  static update(room: Room, command: string, ...args: any): void {
    for (const player of room.players) player.socket!.emit(command, ...args);
    if (room.spectators) {
      for (const spectator of room.spectators) spectator!.emit(command, ...args);
    }
  }

  join_queue(socket: Socket, mode: string): void {
    if (!isValidMode(mode)) return;
    // create a new queue for the mode if it doesnt exist
    if (!this.queue.has(mode)) {
      this.queue.set(mode, []);
    }
    const modeQueue = this.queue.get(mode);
    if (modeQueue === undefined) return;
    // if in any queue
    for (const [, otherQueue] of this.queue.entries()) {
      for (const it of otherQueue) {
        if (it == undefined) continue;
        if (it.id == socket.id) return; // FIXME check for user id, not socket id (it.data.user.id)
      }
    }
    // if playing
    if (this.get_player(socket.id)) return; // FIXME check for user id, not socket id (it.data.user.id)

    // add do queue
    modeQueue.push(socket);

    console.log("join queue " + mode + ": " + socket.id);

    // try to create room
    const modePlayers = modes.get(mode);
    if (modePlayers === undefined) return;
    if (modeQueue.length >= modePlayers) {
      const room: Room | undefined = this.new_room(mode);
      if (room === undefined) return;
      for (let i = 0; i < modePlayers; ++i) {
        this.join_room(room, modeQueue.shift());
      }
      console.log("room created!");
    }
  }
  leave_queue(socket: Socket): void {
    for (const [mode, modeQueue] of this.queue.entries()) {
      const index = modeQueue.indexOf(socket);
      if (index != -1) {
        modeQueue.splice(index, 1);
        console.log("leave queue " + mode + ": " + socket.id);
        break;
      }
    }
  }

  disconnect(socket: Socket) {
    this.leave_queue(socket);
    for (const room of this.rooms.values()) {
      if (room.spectators.indexOf(socket) != -1) {
        room.spectators.splice(room.spectators.indexOf(socket), 1);
      }
      // find disconnected player
      const disconnected_player = room.players.find(player => socket.id === player.socket!.id);
      if (disconnected_player) {
        const disconnected_player_id = disconnected_player.id;
        const is_odd = disconnected_player_id % 2 === 1;
        // separate winners and losers based on the disconnected player's team (odd or even)
        const winners = room.players.filter(player => (is_odd ? player.id % 2 === 0 : player.id % 2 === 1));
        const losers = room.players.filter(player => (is_odd ? player.id % 2 === 1 : player.id % 2 === 0));
        // assign the room's score to the winners
        winners.forEach(winner => {
          winner.stats.score = room.options.score;
        });
        losers.forEach(loser => {
          loser.stats.rival_score = room.options.score;
        });
        this.stop(room, winners, losers);
        break;
      }
    }
  }

  new_room(mode: string, code: string | null = null): Room | undefined {
    if (!isValidMode(mode)) return undefined;
    while(code == null) {
      let rand = (Math.random().toString(36)+'00000000000000000').slice(2, 12);
      if (!this.rooms.has(rand)) {
        code = rand;
      }
    }

    const modePlayers = modes.get(mode) || 0;
    // default/normal options
    let options: Options = {
      canvas: { width: WIDTH, height: HEIGHT },
      mode: Mode.NORMAL,
      mode_name: mode,
      players: 2,
      player_pos: {
              y: HEIGHT / 2,
              x: WIDTH / 10,
      },
      player_scale: { x: 10, y: 48 },
      player_speed: { x: 5, y: 5 },
      ball_pos: { x: (WIDTH / 2) - 5, y: (HEIGHT / 2) - 5 }, // minus half the scale :)
      ball_scale: { x: 10, y: 10 },
      ball_speed: { x: 5, y: 5 },
      // FIXME set to 5 for final version
      score: 1,
    };
    // special modes changes
    if (mode === "special") {
      options.mode = Mode.SPECIAL;
      options.score = 10;
    }
    // set players number
    options.players = modePlayers !== undefined ? modePlayers : 2;
    // create room
    const ret: Room = {
      code: code,
      state: State.WAITING,
      ball: { speed: { x: 0, y: 0 }, pos: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, dir: { x: 0, y: 0 }, firstTouch: true },
      players: [],
      spectators: [],
      options: Object.assign({}, options),
      start: new Date(0),
    }
    this.rooms.set(code, ret)
    return ret;
  }
  join_room(room: Room, socket: Socket | undefined) {
    if (room.state == State.WAITING) {
      const player: Player = {
        id: room.players.length + 1,
        socket: socket,
        room: room,
        ready: false,
        pos: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, speed: { x: 0, y: 0 },
        axis: { x: Axis.NONE, y: Axis.NONE },
        stats: {
          score: 0,
          rival_score: 0,
          come_back: false,
          double_tap: 0,
          blocker: 0,
          streak: false,
          first_point: false,
          precision: 0,
        }
      }
      room.players.push(player);
      if (room.players.length == room.options.players) room.state = State.STARTING;
      socket!.emit('ready', room.code, room.players.length % 2 === 1 ? true : false);

      console.log("sending player ready: " + room.code);
    } else {
      room.spectators.push(socket);
      socket!.emit('ready', room.code, true, true);

      const team1: string[] = room.players.map((player) => player.socket!.id).filter((_, index) => index % 2 === 1);
      const team2: string[] = room.players.map((player) => player.socket!.id).filter((_, index) => index % 2 === 0);
      socket!.emit('players', team2, team1);

      socket!.emit('score', room.players[0].stats.score, room.players[1].stats.score);

      console.log("sending spectator ready: " + room.code);
    }
  }

  get_player(id: string): Player | null {
    for (const room of this.rooms.values()) {
      for (const player of room.players) {
        if (player.socket == undefined) continue;
        if (player.socket.id === id) return player;
      }
    }
    return null;
  }

  get_room(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  get_user_roomcode(id: string): Room | null {
    // Convert the rooms map values to an array
    const roomsArray = Array.from(this.rooms.values());

    // Find the room containing the user with the given userId
    const roomWithUser = roomsArray.find(room => {
      // TODO change socket.id to user.id
      const userInRoom = room.players.some(player => player.socket!.id === id);
      return userInRoom;
    });

    if (!roomWithUser) {
      return null;
    }
    return roomWithUser;
  }

  ready(player: Player | null): void {
    if (player == null) return;
    player.ready = true;
    console.log("ready: " + player.socket!.id);
    this.start(player.room);
  }

  start(room: Room) {
    if (room.state != State.STARTING) {
      return;
    }
    for (const player of room.players) {
      if (player.ready === false) return;
    }

    const countdown: number = 3;
    for (const player of room.players) {
      // send all players name
      const team1: string[] = room.players.map((player) => player.socket!.id).filter((_, index) => index % 2 === 1);
      const team2: string[] = room.players.map((player) => player.socket!.id).filter((_, index) => index % 2 === 0);
      if (room.players.length % 2 === 1) {
        player.socket!.emit('players', team1, team2);
      } else {
        player.socket!.emit('players', team2, team1);
      }
      // send start
      player.socket!.emit('start', countdown);
    }

    console.log("countdown...");
    this.game.start(room);
    const startCountdown = async (): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.game.setInitialPositions(room);
      await new Promise(resolve => setTimeout(resolve, countdown * 1000));
      console.log("starting...");
      room.state = State.INGAME;
    };
    startCountdown();
  }

  stop(room: Room, winners: Player[], losers: Player[]): void {
    if (room.state === State.END) return;
    room.state = State.END;

    // TODO change for user.id
    // TODO add `.user` to get the user of loser and change type
    //const loser: Player | undefined = room.players.find((player) => player.socket!.id != winner.socket!.id,);

    // send score, winners and losers to API
    // TODO centralize  this in a function that receives the players[] and returns the UserScore[]
    const winners_stats: UserStats[] = winners.map((player: Player) => {
      return {
        id: `${player.id}`,  // TODO: @izenynn change to user id
        score: player.stats.score,
        winRatio: 0,
        rivalScore: player.stats.rival_score,
        rivalWinRatio: 0,
        comeBack: player.stats.come_back,
        doubleTap: player.stats.double_tap,
        blocker: player.stats.blocker,
        winningStreak: player.stats.streak,
        firstPoint: player.stats.first_point,
        precision: player.stats.precision,
      };
    });
    const losers_stats: UserStats[] = losers.map((player: Player) => {
      return {
        id: `${player.id}`,  // TODO: @izenynn change to user id
        score: player.stats.score,
        winRatio: 0,
        rivalScore: player.stats.rival_score,
        rivalWinRatio: 0,
        comeBack: player.stats.come_back,
        doubleTap: player.stats.double_tap,
        blocker: player.stats.blocker,
        winningStreak: player.stats.streak,
        firstPoint: player.stats.first_point,
        precision: player.stats.precision,
      };
    });
    // TODO send new CreateMatchDto object
    const match: CreateMatchDto = {
      mode: (room.options.mode === 0 ? "normal" : "special"),
      start: room.start,
      end: new Date(),
      winners: winners_stats,
      losers: losers_stats,
    }
    this.matches.create(match);

    // check archievements
    const userStats = [...winners_stats, ...losers_stats];
    for (const user of userStats) {
      this.achievementsService.verifyByUser(user);
		}

    // create win text
    let winText: string;
    if (winners.length === 1) {
      winText = winners[0].socket!.id + " wins!";
    } else {
      winText = winners[0].socket!.id;
      for (let i = 1; i < winners.length; ++i) winText += ", " + winners[i].socket!.id;
      winText += " win!";
    }

    console.log(winText);
    RoomService.update(room, 'stop', winText);
    this.rooms.delete(room.code);
  }

  @Interval(1000 / 64)
  game_loop(): void {
    for (const room of this.rooms.values()) {
      if (room.state === State.INGAME) {
        this.game.update(room);
      }
    }
  }
}
