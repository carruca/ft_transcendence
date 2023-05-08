import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { RoomService } from './room.service';
import { GameService } from './game.service';
import { ScheduleModule } from '@nestjs/schedule';

import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [ScheduleModule.forRoot(), MatchesModule],
  providers: [GameGateway, RoomService, GameService]
})
export class GameModule {}
