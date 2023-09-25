import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { User } from '../users/entities/user.entity';
import { ChannelsController } from './channels.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, User])],
  providers: [ChannelsService],
  controllers: [ChannelsController]
})
export class ChannelsModule {}
