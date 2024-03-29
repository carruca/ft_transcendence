import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsController } from './channels.controller';
import { User } from '../users/entities/user.entity';
import { Ban } from '../users/entities/ban.entity';
import { Channel } from './entities/channel.entity';
import { ChannelUser } from './entities/channel-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Channel,
    User,
    ChannelUser,
    Ban,
  ])],
  providers: [ChannelsService],
  controllers: [ChannelsController],
  exports: [ChannelsService],
})
export class ChannelsModule {}
