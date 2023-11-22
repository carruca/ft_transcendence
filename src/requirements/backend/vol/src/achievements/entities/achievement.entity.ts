import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
	OneToMany,
} from 'typeorm';
import { AchievementUser } from './achievement-user.entity';
import { User } from '../../users/entities/user.entity';

interface AchievementCondition {
	(user: User): boolean;
}

@Entity()
export class Achievement {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	name: string;

	@Column()
	description: string;

	@Column()
	image: string;

	@OneToMany(() => AchievementUser, achievementUser => achievementUser.achievement)
	users: AchievementUser[];
}
