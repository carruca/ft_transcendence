import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { UserMatch } from '../users/entities/user-match.entity';
import { Match } from '../matches/entities/match.entity';
import { MatchType } from '../matches/entities/match-type.entity';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
	constructor(private configService: ConfigService) {}
	createTypeOrmOptions(): TypeOrmModuleOptions {
		return {
			type: 'postgres',
			host: this.configService.get('POSTGRES_HOST'),
			port: +this.configService.get('POSTGRES_PORT'),
			username: this.configService.get('POSTGRES_USER'),
			password: this.configService.get('POSTGRES_PASSWORD'),
			database: this.configService.get('POSTGRES_DB'),
			entities: [
				User,
				UserMatch,
				Match,
				MatchType,
			],
			synchronize: true,
		};
	}
}
