import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
	OneToMany,
} from 'typeorm';
import { MatchUser } from './match-user.entity';

@Entity()
export class Match {
	@PrimaryGeneratedColumn('uuid')
	id: number;

	@Column()
	type: string;

	@Column()
	start: Date;

	@Column()
	end: Date;

	@OneToMany(() => MatchUser, (matchUser) => matchUser.match, {
		eager: true,
	})
	users: MatchUser[];
}
