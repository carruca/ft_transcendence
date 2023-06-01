import { Injectable } from '@nestjs/common';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { AchievementUser } from './entities/achievement-user.entity';

@Injectable()
export class AchievementsService {
	constructor(
		@InjectRepository(Achievement)
		private achievementsRepository: Repository<Achievement>,

		@InjectRepository(AchievementUser)
		private achievementUsersRepository: Repository<AchievementUser>,
	) {}

  create(createAchievementDto: CreateAchievementDto) {
    return 'This action adds a new achievement';
  }

	setAchievementToUser(id: number) {
		
	}

	async findAchievementUser(id: number) {
	}

  findAll() {
    return this.achievementsRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} achievement`;
  }

  update(id: number, updateAchievementDto: UpdateAchievementDto) {
    return `This action updates a #${id} achievement`;
  }

  remove(id: number) {
    return `This action removes a #${id} achievement`;
  }
}
