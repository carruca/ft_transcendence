import {
  Entity,
  PrimaryGeneratedColumn,
  Column
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ unique: true })
	intraId: number;

  @Column()
  name: string;

  @Column()
	login: string;

	@Column({ nullable: true })
	nickname: string;
}
