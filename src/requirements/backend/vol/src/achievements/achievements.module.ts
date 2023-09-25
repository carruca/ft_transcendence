import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from './entities/achievement.entity';
import { AchievementUser } from './entities/achievement-user.entity';
import { User } from '../users/entities/user.entity';
import { MatchUser } from '../matches/entities/match-user.entity';

import { TwoInARowCondition } from './providers/two-in-a-row-condition';
import { FiveInARowCondition } from './providers/five-in-a-row-condition';
import { TenInARowCondition } from './providers/ten-in-a-row-condition';
import { ZeroGoalkeeperCondition } from './providers/zero-goalkeeper-condition';
import { PeopleVictoryCondition } from './providers/people-victory-condition';
import { PowerDefeatCondition } from './providers/power-defeat-condition';
import { NarrowVictoryCondition } from './providers/narrow-victory-condition';
import { ComebackVictoryCondition } from './providers/comeback-victory-condition';
import { WinningStreakCondition } from './providers/winning-streak-condition';
import { DoubleTapCondition } from './providers/double-tap-condition';
import { BlockerCondition } from './providers/blocker-condition';
import { FirstPointCondition } from './providers/first-point-condition';
import { PrecisionCondition } from './providers/precision-condition';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Achievement,
      AchievementUser,
      User,
      MatchUser,
    ]),
  ],
  controllers: [AchievementsController],
  providers: [
    AchievementsService,
    TwoInARowCondition,
    FiveInARowCondition,
    TenInARowCondition,
    ZeroGoalkeeperCondition,
    PeopleVictoryCondition,
    PowerDefeatCondition,
    NarrowVictoryCondition,
    ComebackVictoryCondition,
    WinningStreakCondition,
    DoubleTapCondition,
    BlockerCondition,
    FirstPointCondition,
    PrecisionCondition,
  ],
  exports: [AchievementsService],
})
export class AchievementsModule {}
