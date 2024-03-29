import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
	ManyToOne,
	CreateDateColumn,
} from 'typeorm';
import { Achievement } from './achievement.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class AchievementUser {
	constructor(user: User, achievement: Achievement) {
		this.user = user;
		this.achievement = achievement;
	}

	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => User, (user) => user.achievements)
	user: User;

	@ManyToOne(() => Achievement, (achievement) => achievement.users, {
		eager: true,
	})
	achievement: Achievement;

	@CreateDateColumn()
	createDate: Date;
}
