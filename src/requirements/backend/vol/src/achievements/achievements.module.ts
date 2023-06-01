import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from './entities/achievement.entity';
import { AchievementUser } from './entities/achievement-user.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
		Achievement,
		AchievementUser,
		User,
	])],
  controllers: [AchievementsController],
  providers: [AchievementsService]
})
export class AchievementsModule {}
