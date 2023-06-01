import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
	OneToMany,
} from 'typeorm';
import { AchievementUser } from './achievement-user.entity';

@Entity()
export class Achievement {
	@PrimaryGeneratedColumn('uuid')
	id: number;

	@Column()
	name: string;

	@Column()
	description: string;

	@Column()
	image: string;

	@OneToMany(() => AchievementUser, (achievementUser) => achievementUser.achievement, {
		eager: true,
	})
	users: AchievementUser[];
}
