import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
	OneToOne
} from 'typeorm';

@Entity()
export class MatchType {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@Column()
	description: string;

	@Column()
	maxScore: number;
}
