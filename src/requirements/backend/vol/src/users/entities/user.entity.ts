import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';

import { MatchUser } from '../../matches/entities/match-user.entity';
import { AchievementUser } from '../../achievements/entities/achievement-user.entity';
import { ChannelUser } from '../../channels/entities/channel-user.entity';
import { Friend } from '../../friends/entities/friend.entity';
import { Block } from './block.entity';
import { Ban } from './ban.entity';

export enum UserMode {
  user,
  owner,
  moderator,
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
/*
  @Column({ default: 0 })
  status: number;
*/
  @Column({ default: UserMode.user })
  mode: UserMode;

  @Column({ default: false })
  disabled: boolean;

  @Column({ default: false })
  banned: boolean;

  @OneToMany(() => MatchUser, (matchUser) => matchUser.user)
  matches: MatchUser[];

  @OneToMany(() => AchievementUser, (achievementUser) => achievementUser.user)
  achievements: AchievementUser[];

  @OneToMany(() => ChannelUser, (channelUser) => channelUser.user)
  channels: ChannelUser[];

  @ManyToMany(() => Friend, (friend) => friend.users)
  @JoinTable()
  friends: Friend[];

  @OneToMany(() => Block, (block) => block.user)
  blocks: Block[];

  @OneToMany(() => Ban, (ban) => ban.user)
  bans: Ban[];

  @Column({ default: '', nullable: true })
  two_fa_token: string;

  @Column({ default: false, nullable: false })
  two_fa_enabled: boolean;
}
