import {
  Entity,
  Column,
  PrimaryGeneratedColumn,	
	OneToOne,
	JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Match } from './match.entity';

@Entity()
export class MatchUser {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	score: number;

//	@OneToOne(() => User)
	@Column()
	userId: number;

	@OneToOne(() => Match)
	@JoinColumn()
	match: Match;
}
