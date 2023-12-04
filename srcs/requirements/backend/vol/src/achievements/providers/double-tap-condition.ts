import { Injectable } from '@nestjs/common';
import { AchievementCondition } from './achievement-condition';
import { UserStats } from '../../matches/dto/create-match.dto';

@Injectable()
export class DoubleTapCondition extends AchievementCondition {
  async evaluate(userStats: UserStats): Promise<boolean> {
    return userStats.doubleTap ? true : false;
  }
}
