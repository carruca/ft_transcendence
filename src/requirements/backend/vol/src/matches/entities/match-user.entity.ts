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
    user: User,
    match: Match,
  ) {
    this.score = score;
    this.user = user;
    this.match = match;
  }

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  score: number;
/*
  @Column()
  winner: boolean;
*/
  @ManyToOne(() => Match, (match) => match.users)
  match: Match;

  @ManyToOne(() => User, (user) => user.matches)
  user: User;
}
