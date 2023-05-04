'use strict'
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { GameModule } from './game/game.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { IntraModule as IntraAuthModule } from './auth/intra/intra.module';
import { RouterModule } from '@nestjs/core';

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
    RouterModule.register(routes),
    ChatModule,
    GameModule,
    AuthModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService],
})
export class AppModule {}
