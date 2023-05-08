import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
	OneToOne
} from 'typeorm';
//import { MatchType } from './match-type.entity';

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
/*
	@OneToOne(() => MatchType)
	type:	MatchType;
*/
}
