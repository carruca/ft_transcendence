import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum FriendStatus {
  requested,
  accepted,
  rejected,
}

@Entity()
export class Friend {
  constructor(
    users: User[],
    receiverId: number,
    status: FriendStatus,
  ) {
    this.users = users;
    this.receiverId = receiverId;
    this.status = status;
  }

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => User, (user) => user.friends)
  users: User[];

  @Column()
  receiverId: number;

  @Column()
  status: FriendStatus;
}
