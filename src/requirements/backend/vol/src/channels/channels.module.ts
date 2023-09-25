import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, User])],
  providers: [ChannelsService]
})
export class ChannelsModule {}
