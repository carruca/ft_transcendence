import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
	ManyToOne,
} from 'typeorm';
import { Achievement } from './achievement.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class AchievementUser {
	@PrimaryGeneratedColumn('uuid')
	id: number;

	@ManyToOne(() => User, (user) => user.achievements)
	user: User;

	@ManyToOne(() => Achievement, (achievement) => achievement.users)
	achievement: Achievement;

	@Column()
	timestamp: Date;
}
