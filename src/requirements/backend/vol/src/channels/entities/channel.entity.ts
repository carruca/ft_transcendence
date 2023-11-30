import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { ChannelUser } from './channel-user.entity';
import { User } from '../../users/entities/user.entity';
import { CreateChannelDto } from '../dto/create-channel.dto';
import { Ban } from '../../users/entities/ban.entity';

@Entity()
export class Channel {
  constructor(
    name: string,
    ownerId: string,
    id?: string | undefined,
    topic?: string | undefined,
    password?: string | undefined,
  ) {
	  if (id !== undefined) {
      this.id = id;
    }
    this.name = name;
    this.ownerId = ownerId;
    this.topic = topic;
    if (password !== undefined) {
      this.password = password;
    }
  }
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  ownerId: string;

  @CreateDateColumn()
  createdDate: Date;

  @Column({ nullable: true })
  topic?: string;

  @Column({ nullable: true })
  topicSetDate?: Date;

  @Column({ nullable: true })
  topicUser?: string;

  @Column({ nullable: true })
  password?: string;

  @OneToMany(() => ChannelUser, (channelUser) => channelUser.channel) 
  users: ChannelUser[];

  @OneToMany(() => Ban, (ban) => ban.channel) 
  bans: Ban[];
}
