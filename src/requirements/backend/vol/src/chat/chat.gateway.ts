import {
	SubscribeMessage,
	WebSocketGateway,
	MessageBody,
	OnGatewayInit,
	OnGatewayConnection,
	OnGatewayDisconnect,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RecvMessageDto } from './dto/recv-message.dto'
import { ChatService } from './chat.service';

@WebSocketGateway({
	cors: {
		origin: process.env.NEST_FRONT_URL,
	},
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	private readonly logger = new Logger(ChatGateway.name);

	constructor(private chatService: ChatService) {}

	afterInit(_server: Server) {
		this.logger.log('WebSocketGateway initialized');
	}

	handleConnection(client: Socket, ..._args: any[]) {
		this.logger.log(`Client connected: ${client.id}`);
	}

	handleDisconnect(client: Socket) {
		this.logger.log(`Client disconnected: ${client.id}`);
	}

  @SubscribeMessage('message')
  handleMessage(@MessageBody() message: RecvMessageDto) {
		this.logger.debug(`Message received "${message.content}" from user: ${message.user}`);
		this.server.emit('message', message);
  }
}
