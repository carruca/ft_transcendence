import {
  Entity,
  Column,
  PrimaryGeneratedColumn,	
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Match } from './match.entity';

@Entity()
export class MatchUser {
  constructor(
    score: number,
	userId: number,
	match: Match,
  ) {
    this.score = score;
	this.userId = userId;
	this.match = match;
  }

  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  score: number;

//@ManyToOne(() => User)
  @Column()
  userId: number;

  @ManyToOne(() => Match, (match) => match.users)
  match: Match;
}
