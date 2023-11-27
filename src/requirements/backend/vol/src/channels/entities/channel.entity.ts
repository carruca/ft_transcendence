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
    createChannelDto: CreateChannelDto,
  ) {
    if (createChannelDto) {
	    if (createChannelDto.id !== undefined) {
        this.id = createChannelDto.id;
      }
      this.name = createChannelDto.name;
      this.ownerId = createChannelDto.ownerId;
      this.topic = createChannelDto.topic;
      if (createChannelDto.password !== undefined) {
        this.password = createChannelDto.password;
      }
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
