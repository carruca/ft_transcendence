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
    receiverId: string,
    senderId: string,
    status: FriendStatus,
    nickname?: string,
  ) {
    this.users = users;
    this.receiverId = receiverId;
    this.senderId = senderId;
    this.status = status;
    this.nickname = nickname;
  }

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => User, (user) => user.friends, {
    onDelete: 'CASCADE'
  })
  users: User[];

  @Column()
  receiverId: string;

  @Column()
  senderId: string;

  @Column()
  status: FriendStatus;

  @Column({ nullable: true })
  nickname?: string;
}
