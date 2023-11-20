import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { AchievementUser } from '../../achievements/entities/achievement-user.entity';
import { ChannelUser } from '../../channels/entities/channel-user.entity';
import { Friend } from '../../friends/entities/friend.entity';

export enum UserPermits {
  user,
  owner,
  moderator,
  banned,
  disabled,
}

@Entity()
export class User {
  constructor(
    intraId: number,
    name: string,
    login: string,
  ) {
    this.intraId = intraId;
    this.name = name;
    this.login = login;
  }

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  intraId: number;

  @Column()
  name: string;

  @Column()
  login: string;

  @Column({ nullable: true, unique: true })
  nickname?: string;

  @Column({ default: 100 })
  rating: number;

  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  losses: number;

  @Column({ default: 0 })
  status: number;

  @Column({ default: UserPermits.user })
  permits: UserPermits;

  @OneToMany(() => AchievementUser, (achievementUser) => achievementUser.user)
  achievements: AchievementUser[];

  @OneToMany(() => ChannelUser, (channelUser) => channelUser.user)
  channels: ChannelUser[];

  @ManyToMany(() => Friend, (friend) => friend.users)
  @JoinTable()
  friends: Friend[];

  @Column({ default: '', nullable: true })
  two_fa_token: string;

  @Column({ default: false, nullable: false })
  two_fa_enabled: boolean;
}
