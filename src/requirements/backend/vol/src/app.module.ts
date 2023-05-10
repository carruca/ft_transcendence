'use strict'
import {
	Module,
	NestModule,
	MiddlewareConsumer,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { GameModule } from './game/game.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { IntraModule as IntraAuthModule } from './auth/intra/intra.module';
import { RouterModule } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './config/typeorm-config.service';
import { UsersModule } from './users/users.module';
import { AuthMiddleware } from './auth/auth.middleware';
import { MatchesModule } from './matches/matches.module';

const routes = [
  {
    path: 'auth',
    module: AuthModule,
    children: [
      {
        path: 'intra',
        module: IntraAuthModule
      }
    ]
  }
];

@Module({
  imports: [
		ConfigModule.forRoot({
			validate,
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			useClass: TypeOrmConfigService,
		}),
    RouterModule.register(routes),
    ChatModule,
		UsersModule,
		MatchesModule,
    GameModule,
    AuthModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(AuthMiddleware)
			.forRoutes('users')
	}
}
