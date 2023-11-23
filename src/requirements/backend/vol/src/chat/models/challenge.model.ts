import {
  UserModel as User,
} from '../models';

import {
  Mode as GameMode,
} from '../../game/game.interface';

import {
  v4 as uuidv4,
} from 'uuid';

export class ChallengeModel {
  private readonly uuid_;
  private readonly numPlayers_: number;
  private readonly gameMode_: number;
  private players_: User[];
  private count_: number = 0;

  constructor(gameMode: GameMode) {
    this.uuid_ = uuidv4();
    if (gameMode == GameMode.NORMAL)
      this.numPlayers_ = 2;
    else if (gameMode == GameMode.SPECIAL)
      this.numPlayers_ = 4;
    this.players_ = new Array(this.numPlayers_);
    this.gameMode_ = gameMode;
  }

  addPlayer(player: User): boolean {
    if (this.count_ === this.players_.length)
      return false;
    this.players_.push(player);
    ++this.count_;
    return true;
  }

  removePlayer(player: User): boolean {
    if (this.players_.some(item => item === player)) {
      this.players_ = this.players_.filter(item => item === player);
      --this.count_;
      return true;
    }
    return false;
  }

  get isComplete(): boolean {
    return (this.count_ == this.numPlayers_);
  }

  get uuid(): string {
    return this.uuid_;
  }

  get playersArray(): User[] {
    return this.players_;
  }

  get gameMode(): GameMode {
    return this.gameMode;
  }
}
