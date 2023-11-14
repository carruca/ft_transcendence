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
import { AchievementsModule } from './achievements/achievements.module';
import { ServeStaticModule } from '@nestjs/serve-static/dist/serve-static.module';
import { ChannelsModule } from './channels/channels.module';
import { FriendsModule } from './friends/friends.module';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER } from '@nestjs/core';
import { ExceptionInterceptor } from './exception.interceptor';
import * as path from 'path';

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
    ServeStaticModule.forRoot(
      {
        serveRoot: '/public',
        rootPath: path.resolve(__dirname, '..', 'public'),
      }
    ),
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    RouterModule.register(routes),
    AuthModule,
    UsersModule,
    ChatModule,
    MatchesModule,
    GameModule,
    AchievementsModule,
    ChannelsModule,
    FriendsModule,
    JwtModule.register({
      secret: process.env.NEST_COOKIE_SECRET,
      signOptions: { expiresIn: '3d' },
    })
  ],
  controllers: [AppController, AuthController],
  providers: [
    AppService,
    AuthService,
    {
      provide: APP_FILTER,
      useClass: ExceptionInterceptor,
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    (consumer
      .apply(AuthMiddleware)
      .exclude()
    )
      .forRoutes('users')
  }
}
