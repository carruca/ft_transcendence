import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AchievementUser } from '../achievements/entities/achievement-user.entity';
import { Channel } from '../channels/entities/channel.entity';
import { Friend } from '../friends/entities/friend.entity';
import { JwtModule } from '@nestjs/jwt';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      AchievementUser,
      Channel,
      Friend,
    ]),
    JwtModule.register({
      secret: process.env.NEST_COOKIE_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    forwardRef(() => ChatModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
