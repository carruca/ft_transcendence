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

@WebSocketGateway({ cors: true })
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer() server: Server;

	afterInit(server: Server) {
		this.server = server;
		this.server.on('connection', (client: Socket) =>{
			console.log(`Client connected: ${client.id}`)
		});
	}

	handleConnection(client: Socket, ...args: any[]) {
		console.log(`Client connected: ${client.id}`);
	}

	handleDisconnect(client: Socket) {
		console.log(`Client disconnected: ${client.id}`);
	}

  @SubscribeMessage('send-message')
  handleMessage(@MessageBody() data: string) {
		console.log(`New message received: ${data}`);
		this.server.emit('new-message', data);
  }
}
