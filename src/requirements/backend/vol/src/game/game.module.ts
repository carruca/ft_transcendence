import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { RoomService } from './room.service';
import { GameService } from './game.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [GameGateway, RoomService, GameService]
})
export class GameModule {}
