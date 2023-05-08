import {
  Entity,
  Column,
  PrimaryGeneratedColumn,	
	ManyToOne,
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

	@ManyToOne(() => Match, (match) => match.users)
//	@JoinColumn()
	match: Match;
}
