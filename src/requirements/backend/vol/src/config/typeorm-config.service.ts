import { Injectable } from '@nestjs/common';
import {
	TypeOrmOptionsFactory,
	TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { createConnection } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { User } from '../users/entities/user.entity';
import { Match } from '../matches/entities/match.entity';
import { MatchUser } from '../matches/entities/match-user.entity';
import { Achievement } from '../achievements/entities/achievement.entity';
import { AchievementUser } from '../achievements/entities/achievement-user.entity';
import { CreateDefaultAchievement1686824989874 } from '../achievements/migrations/1686824989874-createDefaultAchievement';
import { Channel } from '../channels/entities/channel.entity';
import { ChannelUser } from '../channels/entities/channel-user.entity';
import { Friend } from '../friends/entities/friend.entity';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}
  async createTypeOrmOptions(): Promise<TypeOrmModuleOptions> {
    const connection = await createConnection({
      type: 'postgres',
      host: this.configService.get('POSTGRES_HOST'),
      port: +this.configService.get('POSTGRES_PORT'),
      username: this.configService.get('POSTGRES_USER'),
      password: this.configService.get('POSTGRES_PASSWORD'),
      database: this.configService.get('POSTGRES_DB'),
      entities: [
        User,
        Match,
        MatchUser,
        Achievement,
        AchievementUser,
        Channel,
        ChannelUser,
        Friend,
      ],
      migrationsRun: true,
      synchronize: true,
    });

    return {
      type: 'postgres',
      host: this.configService.get('POSTGRES_HOST'),
      port: +this.configService.get('POSTGRES_PORT'),
      username: this.configService.get('POSTGRES_USER'),
      password: this.configService.get('POSTGRES_PASSWORD'),
      database: this.configService.get('POSTGRES_DB'),
      entities: [
        User,
        Match,
        MatchUser,
        Achievement,
        AchievementUser,
        Channel,
        ChannelUser,
        Friend,
      ],
      migrationsRun: true,
      synchronize: true,
      migrations: [
        CreateDefaultAchievement1686824989874,
      ],
    };
  }
}
