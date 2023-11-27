import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';

import { User } from './user.entity';
import { Channel } from '../../channels/entities/channel.entity';

@Entity()
export class Ban {
  constructor(
    user: User,
    channel: Channel
  ){
    this.user = user;
    this.channel = channel;
  }
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Channel, (channel) => channel.bans, {
    onDelete: 'CASCADE'
  })
  channel: Channel;

  @ManyToOne(() => User, (user) => user.bans, {
    onDelete: 'CASCADE'
  })
  user: User;
}
