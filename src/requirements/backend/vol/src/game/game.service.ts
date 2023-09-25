import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { stringify } from 'querystring';
import { Vector2, Mode, Options, Player, State, Room, Axis, Ball } from './game.interface';
import { RoomService } from './room.service';

@Injectable()
export class GameService {
  constructor(
    @Inject(forwardRef(() => RoomService)) private roomService: RoomService,
  ) {}
  public start(room: Room): void {
    // ball
    this.reset_ball(room);
    // players
    if (room.options.mode === Mode.NORMAL) {
      room.players[0].pos = {
        x: room.options.canvas.width - room.options.player_pos.x - room.options.player_scale.x,
        y: room.options.player_pos.y,
      };
      room.players[1].pos = {
        x: room.options.player_pos.x,
        y: room.options.player_pos.y,
      };
    } else if (room.options.mode === Mode.SPECIAL) {
      const mod: number = 100;
      room.players[0].pos = {
        x: room.options.canvas.width - room.options.player_pos.x - room.options.player_scale.x,
        y: room.options.player_pos.y - mod,
      };
      room.players[1].pos = {
        x: room.options.player_pos.x,
        y: room.options.player_pos.y - mod,
      };
      room.players[2].pos = {
        x: room.options.canvas.width - room.options.player_pos.x - room.options.player_scale.x,
        y: room.options.player_pos.y + mod,
      };
      room.players[3].pos = {
        x: room.options.player_pos.x,
        y: room.options.player_pos.y + mod,
      };
    }
    for (const player of room.players) {
      player.scale = room.options.player_scale;
      player.speed = room.options.player_speed;
    }
    // record start time
    room.start = new Date();
  }
  public reset_ball(room: Room, left: boolean = false): void {
    function getRandomNumber(min: number, max: number): number {
      return min + Math.random() * (max - min);
    }
    function normalizeVector(vector: Vector2): Vector2 {
      const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
      return { x: vector.x / length, y: vector.y / length };
    }
    function getRandomNormalizedDirection(): Vector2 {
      const minAngle = -Math.PI / 5;
      const maxAngle = Math.PI / 5;
      const randomAngle = getRandomNumber(minAngle, maxAngle);
      // Calculate the x and y components of the direction vector
      const directionVector: Vector2 = {
        x: left ? Math.cos(randomAngle) : -Math.cos(randomAngle),
        y: Math.sin(randomAngle),
      };
      const normalizedDirectionVector = normalizeVector(directionVector);
      return normalizedDirectionVector;
    }
    function getRandomPosition(): Vector2 {
      const posY = getRandomNumber(0 + 50, room.options.canvas.height - room.options.ball_scale.y - 50);
      return { x: room.options.ball_pos.x, y: posY };
    }
    function getSpeed(): Vector2 {
      const mod = 2;
      return { x: room.options.ball_speed.x / mod, y: room.options.ball_speed.y / 2 };
    }

    room.ball.pos = getRandomPosition();
    room.ball.scale = Object.assign({}, room.options.ball_scale);
    room.ball.speed = getSpeed();
    room.ball.dir = getRandomNormalizedDirection();
    room.ball.firstTouch = true;
  }

  private check_player_col(ball: Ball, npos: Vector2, player: Player): Vector2 | null {
    // Check for collision
    const collisionX = player.pos.x + player.scale.x >= npos.x && player.pos.x <= npos.x + ball.scale.x;
    const collisionY = player.pos.y + player.scale.y >= npos.y && player.pos.y <= npos.y + ball.scale.y;

    if (collisionX && collisionY) {
      // Calculate relative y position of the ball to the player
      const relativeY = (player.pos.y + player.scale.y / 2) - (npos.y + ball.scale.y / 2);
      const normalizedRelativeY = relativeY / (player.scale.y / 2);

      // Map normalizedRelativeY to an angle in the range [-45, 45] degrees
      const maxAngle = Math.PI / 4; // 45 degrees
      const angleStep = maxAngle / 4; // Divide the angle range into 8 parts
      const angle = Math.round(normalizedRelativeY * 4) * angleStep;

      // Calculate new direction
      const newDirection: Vector2 = {
        x: (player.id % 2 === 1 ? -Math.cos(angle) : Math.cos(angle)),
        y: -Math.sin(angle),
      };

      // Add a small gap between the ball and the player after the collision
      const gap = 0.25;
      if (newDirection.x > 0) {
        ball.pos.x = player.pos.x + player.scale.x + gap;
      } else {
        ball.pos.x = player.pos.x - ball.scale.x - gap;
      }

      return newDirection;
    }

    return null;
  }

  private check_wall_col(room: Room): Vector2 | null {
    const collisionTop = room.ball.pos.y <= 0;
    const collisionBottom = room.ball.pos.y + room.ball.scale.y >= room.options.canvas.height;

    if (collisionTop || collisionBottom) {
      const newDirection: Vector2 = {
        x: room.ball.dir.x,
        y: -room.ball.dir.y,
      }

      return newDirection;
    }

    return null;
  }
  private check_score_col(room: Room): number {
    let scorer: number;

    // get id of scorer
    if (room.ball.pos.x < 0) {
      scorer = 0;
    } else if (room.ball.pos.x > room.options.canvas.width) {
      scorer = 1;
    } else {
      return -1;
    }
    // stat: precision
    let rad: number = 25;
    if (room.ball.pos.y > room.options.canvas.height - rad || room.ball.pos.y < 0 + rad) {
      for (let i = scorer; i < room.players.length; i += 2) {
        room.players[i].stats.precision++;
      }
    }

    return scorer;
  }

  private normalPlayer(room: Room) {
    for (const player of room.players) {
      if ((player.axis.y === Axis.NEG && player.pos.y > 0)
          || (player.axis.y === Axis.POS && player.pos.y < room.options.canvas.height - player.scale.y)) {
        player.pos.y += player.speed.y * player.axis.y;
      }
    }
  }
  private specialPlayer(room: Room) {
    for (const player of room.players) {
      const axisX = player.axis.x * (player.id % 2 === 1 ? 1 : -1);
      if ((axisX === Axis.NEG && player.pos.x > 0)
          || (axisX === Axis.POS && player.pos.x < room.options.canvas.width - player.scale.x)) {
        player.pos.x += player.speed.x * axisX;
      }
      if ((player.axis.y === Axis.NEG && player.pos.y > 0)
          || (player.axis.y === Axis.POS && player.pos.y < room.options.canvas.height - player.scale.y)) {
        player.pos.y += player.speed.y * player.axis.y;
      }
    }
  }

  private normalBall(room: Room) {
    let scorer = this.check_score_col(room);
    if (scorer >= 0) {
      // stats: first point
      if (room.players[0].stats.score == 0 && room.players[1].stats.score == 0) {
        for (let i = scorer; i < room.players.length; i += 2) {
          room.players[i].stats.first_point = true;
        }
      }
      // stats: streak
      if (room.players[scorer].stats.score == 0) {
        for (let i = scorer; i < room.players.length; i += 2) {
          room.players[i].stats.streak = true;
        }
      }
      if (room.players[scorer == 0 ? 1 : 0].stats.streak == true) {
        for (let i = (scorer == 0 ? 1 : 0); i < room.players.length; i += 2) {
          room.players[i].stats.streak = false;
        }
      }
      // update score
      for (let i = scorer; i < room.players.length; i += 2) {
        room.players[i].stats.score++;
      }
      for (let i = (scorer == 0 ? 1 : 0); i < room.players.length; i += 2) {
        room.players[i].stats.rival_score++;
      }

      console.log("score 0: " + room.players[0].socket!.id + " - " + room.players[0].stats.score);
      console.log("score 1: " + room.players[1].socket!.id + " - " + room.players[1].stats.score);
      RoomService.update(room, 'score', room.players[0].stats.score, room.players[1].stats.score);
      const winners = room.players.filter(player => player.stats.score === room.options.score);
      const losers = room.players.filter(player => player.stats.score !== room.options.score);
      if (winners.length > 0) {
        this.roomService.stop(room, winners, losers);
        return;
      }
      const startCountdown = async (): Promise<void> => {
        // hide ball above canvas
        room.ball.dir = { x: 0, y: 0 };
        room.ball.pos = { x: room.options.ball_pos.x, y: -room.options.ball_scale.y - 10 };
        // wait 1 second and restart
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.reset_ball(room, scorer % 2 === 1 ? true : false);
      };
      startCountdown();
    }
    const npos: Vector2 = {
        x: room.ball.pos.x + (room.ball.speed.x * room.ball.dir.x),
        y: room.ball.pos.y + (room.ball.speed.y * room.ball.dir.y)};
    let ndir: Vector2 | null;
    for (const player of room.players) {
      ndir = this.check_player_col(room.ball, npos, player);
      if (ndir !== null) {
        room.ball.dir = ndir;
        if (room.ball.firstTouch === true) {
          room.ball.speed = Object.assign({}, room.options.ball_speed);
          room.ball.firstTouch = false;
        } else {
          room.ball.speed.x *= 1.1;
          room.ball.speed.y *= 1.1;
        }
        break;
      }
    }
    ndir = this.check_wall_col(room);
    if (ndir !== null) room.ball.dir = ndir;

    room.ball.pos.x += (room.ball.speed.x * room.ball.dir.x);
    room.ball.pos.y += (room.ball.speed.y * room.ball.dir.y);
  }

  private normalEmit(room: Room, emitBall: boolean = true): void {
    if (emitBall) {
      RoomService.update(room, 'update', 0, room.ball.pos.x, room.ball.pos.y, room.ball.scale.x, room.ball.scale.y);
    }
    let i: number = 1;
    for (const player of room.players) {
      RoomService.update(room, 'update', i, player.pos.x, player.pos.y, player.scale.x, player.scale.y);
      i++;
    }
  }

  public update(room: Room): void {
    if (room.options.mode === Mode.NORMAL) {
      this.normalPlayer(room);
      this.normalBall(room);
      this.normalEmit(room);
    } else if (room.options.mode === Mode.SPECIAL) {
      this.specialPlayer(room);
      this.normalBall(room);
      this.normalEmit(room);
    }
  }

  public setInitialPositions(room: Room) {
    if (room.options.mode === Mode.NORMAL) {
      this.normalEmit(room, false);
    } else if (room.options.mode === Mode.SPECIAL) {
      this.normalEmit(room, false);
    }
  }
}
