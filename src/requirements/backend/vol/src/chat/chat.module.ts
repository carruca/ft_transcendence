import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Server } from 'socket.io';

@Module({
  	providers: [
		ChatGateway,
		ChatService,
		Server,
	]
})
export class ChatModule {}
