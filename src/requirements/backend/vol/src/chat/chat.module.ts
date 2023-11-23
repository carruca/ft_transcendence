import { Module, OnModuleInit } from '@nestjs/common';
import { ChatManager } from './managers';
import { ChatGateway } from './chat.gateway';
import { ChatDatabase } from './chat.database';

import { ChannelsModule } from '../channels/channels.module';
import { UsersModule } from '../users/users.module';
import { FriendsModule } from '../friends/friends.module';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ChannelsModule,
    UsersModule,
    FriendsModule,
    AuthModule,
  ],
  providers: [
    ChatGateway,
    ChatManager,
    ChatDatabase,
  ],
  exports: [
    ChatManager,
  ]
})
export class ChatModule implements OnModuleInit {
  constructor(private readonly chat_: ChatManager) { 
  }

  onModuleInit() {
    this.chat_.raiseInitializationEvents();
  }
}
