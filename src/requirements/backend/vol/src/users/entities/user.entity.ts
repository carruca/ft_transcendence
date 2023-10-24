import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { AchievementUser } from '../../achievements/entities/achievement-user.entity';
import { Channel } from '../../channels/entities/channel.entity';
import { ChannelUser } from '../../channels/entities/channel-user.entity';
import { Friend } from '../../friends/entities/friend.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ unique: true })
  intraId: number;

  @Column()
  name: string;

  @Column()
  login: string;

  @Column({ nullable: true, unique: true })
  nickname: string;

  @Column({ default: 100 })
  rating: number;

  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  losses: number;

  @Column({ default: 0 })
  status: number;

  @Column({ default: 0 })
  permits: number;

  @OneToMany(() => AchievementUser, (achievementUser) => achievementUser.user)
  achievements: AchievementUser[];
/*
  @OneToMany(() => ChannelUser, (channelUser) => channelUser.user)
  channels: ChannelUser[];
*/
  @ManyToMany(() => Friend, (friend) => friend.users)
  @JoinTable()
  friends: Friend[];
}
