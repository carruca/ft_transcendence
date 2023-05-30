import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
	OneToMany,
} from 'typeorm';
import { AchievementUser } from '../../achievements/entities/achievement-user.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ unique: true })
	intraId: number;

  @Column()
  name: string;

  @Column()
	login: string;

	@Column({ nullable: true, unique: true })
	nickname: string;

	@Column({ default: 100 })
	rating: number;

	@OneToMany(() => AchievementUser, (achievementUser) => achievementUser.achievement, {
		eager: true,
	})
	achievements: AchievementUser[];
}
