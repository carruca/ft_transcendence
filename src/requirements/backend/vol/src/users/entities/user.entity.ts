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

  @Column({ unique: true })
  name: string;

	@Column({ unique: true })
	email: string;

  @Column()
  avatar: string;

	@Column()
	status: number;
}
