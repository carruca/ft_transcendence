import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
	OneToOne
} from 'typeorm';
import { MatchType } from './match-type.entity';

@Entity()
export class Match {
	@PrimaryGeneratedColumn('uuid')
	id: number;

	@OneToOne(() => MatchType)
	type:	MatchType;

	@Column()
	start: Date;

	@Column()
	end: Date;
}
