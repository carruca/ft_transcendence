import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
	ManyToMany,
	ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Channel {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	name: string;

	@ManyToOne(() => User)
	owner: User;

	@ManyToOne(() => User)
	successor?: User;

	@Column()
	topic?: string;

	@Column()
	password?: string;

	@ManyToMany(() => User, (user) => user.channels, {
		cascade: true
	})
	users: User[];

	@ManyToMany(() => User)
	admins: User[]; 

	@ManyToMany(() => User)
	banned: User[];

	@ManyToMany(() => User)
	muted: User[];
}
