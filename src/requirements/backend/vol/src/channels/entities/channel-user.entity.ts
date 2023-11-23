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
    user: User,
    admin: boolean,
  ) {
    this.channel = channel;
    this.user = user;
    this.admin = admin;
  }

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.channels, { eager: true })
  user: User;

  @ManyToOne(() => Channel, (channel) => channel.users)
  channel: Channel;

  @Column({ default: false })
  admin: boolean;

  @Column({ default: false })
  banned: boolean;

  @Column({ default: false })
  muted: boolean;
}
