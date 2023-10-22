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
      this.owner = createChannelDto.owner;
      this.topic = createChannelDto.topic;
      this.password = createChannelDto.password;
    }
  }
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

//  @ManyToOne(() => User)
  @Column()
  owner: string;

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

  @OneToMany(() => ChannelUser, (channelUser) => channelUser.channel, {
  })
  users: ChannelUser[];
}
