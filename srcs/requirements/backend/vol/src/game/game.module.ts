import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { RoomService } from './room.service';
import { GameService } from './game.service';
import { ScheduleModule } from '@nestjs/schedule';

import { MatchesModule } from '../matches/matches.module';

import { AchievementsModule } from '../achievements/achievements.module';

import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MatchesModule,
    AchievementsModule,
    ChatModule,
  ],
  providers: [GameGateway, RoomService, GameService]
})
export class GameModule {}
