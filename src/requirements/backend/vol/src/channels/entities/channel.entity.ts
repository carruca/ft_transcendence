import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @ManyToOne(() => User)
  owner: User;

  @ManyToOne(() => User)
  successor?: User;

  @CreateDateColumn()
  createdDate: Date;

  @Column()
  topic?: string;

  @Column()
  topicSetDate?: Date;

  @Column()
  topicUser?: string;

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
