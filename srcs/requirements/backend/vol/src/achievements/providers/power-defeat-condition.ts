import { Injectable } from '@nestjs/common';
import { AchievementCondition } from './achievement-condition';
import { UserStats } from '../../matches/dto/create-match.dto';

@Injectable()
export class PowerDefeatCondition extends AchievementCondition {
  async evaluate(userStats: UserStats): Promise<boolean> {
    return false;
  }
}
