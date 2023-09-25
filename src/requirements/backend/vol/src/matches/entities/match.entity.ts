import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { MatchUser } from './match-user.entity';

@Entity()
export class Match {
  constructor(
    type: string,
	start: Date,
	end: Date
  ) {
    this.type = type;
	this.start = start;
	this.end = end;
  }
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

  @Column({ type: "int", array: true, default: [] })
  winners: number[];
}
