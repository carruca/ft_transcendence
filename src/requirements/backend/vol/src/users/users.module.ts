import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AchievementUser } from '../achievements/entities/achievement-user.entity';
import { Channel } from '../channels/entities/channel.entity';
import { Friend } from '../friends/entities/friend.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    User,
    AchievementUser,
    Channel,
    Friend,
  ])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
