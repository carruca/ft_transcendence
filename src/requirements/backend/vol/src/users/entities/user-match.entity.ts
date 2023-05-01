import {
  Entity,
  Column,
  PrimaryGeneratedColumn,	
	OneToOne,
} from 'typeorm';
import { User } from './user.entity'; 
import { Match } from './match.entity'; 

@Entity()
export class UserMatch {
	@PrimaryGeneratedColumn()
	score: number;

	@OneToOne(() => User)
	userId: User;

	@OneToOne(() => Match)
	matchId: Match;
}
