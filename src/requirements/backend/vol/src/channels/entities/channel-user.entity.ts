import {
  Entity,
  Column,
  PrimaryGeneratedColumn,	
  ManyToOne,
} from 'typeorm';
import { Channel } from './channel.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class ChannelUser {
  constructor(
   channel: Channel,
   userId: number,
   admin: boolean,
  ) {
    this.channel = channel;
	this.userId = userId;
	this.admin = admin;
  }

  @PrimaryGeneratedColumn('uuid')
  id: number;

//TODO:
//@ManyToOne(() => User, (user) => user.channels)
  @Column()
  userId: number;

  @ManyToOne(() => Channel, (channel) => channel.users)
  channel: Channel;

  @Column({ default: false})
  admin: boolean;

  @Column({ default: false})
  banned: boolean;

  @Column({ default: false})
  muted: boolean;
}