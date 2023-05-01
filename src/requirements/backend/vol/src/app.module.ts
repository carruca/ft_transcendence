'use strict'
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
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
    AuthModule,
		UsersModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService],
})
export class AppModule {}
