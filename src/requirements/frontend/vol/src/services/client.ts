import socket from './ws';
import { reactive } from 'vue';

import { chatService } from './chat.service';

class ClientData {
  
}

class Client {
  private readonly data_ = reactive(ClientData);

  constructor() {
    socket.on('reterr', this.onRetErr.bind(this));
    socket.on('register', this.onRegister.bind(this));
    socket.on('create', this.onCreate.bind(this));
    socket.on('join', this.onJoin.bind(this));
    socket.on('part', this.onPart.bind(this));
  /*
    socket.on('join', this.onJoin.bind(this));
    socket.on('part', this.onPart.bind(this));
    socket.on('kick', this.onKick.bind(this));
    socket.on('register', this.onRegister.bind(this));
    socket.on('name', this.onName.bind(this));
    socket.on('topic', this.onTopic.bind(this));
    socket.on('promote', this.onPromote.bind(this));
    socket.on('demote', this.onDemote.bind(this));
    socket.on('mute', this.onMute.bind(this));
    socket.on('unmute', this.onUnmute.bind(this));
    socket.on('ban', this.onBan.bind(this));
    socket.on('unban', this.onUnban.bind(this));
    socket.on('password', this.onPassword.bind(this));
    socket.on('update', this.onUpdate.bind(this));
    socket.on('type', this.onType.bind(this));
    socket.on('chanmsg', this.onChanmsg.bind(this));
    socket.on('convmsg', this.onConvmsg.bind(this));
    socket.on('convopen', this.onConvopen.bind(this));
    */
  }

  onRetErr(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    console.log("onRetErr:", data);
  }

  onRegister(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
  }

  create(channelUUID: string, password?: string) {
    socket.emit('create', [ channelUUID, password ]);
  }

  onCreate(dataJSON: string) {
    const data = JSON.parse(dataJSON);
  }

  join(channelUUID: string, password?: string) {
    socket.emit('join', [ channelUUID, password ]);
  }

  onJoin(dataJSON: string) {
    const data = JSON.parse(dataJSON);
  }

  part(channelUUID: string) {
    socket.emit('part', [ channelUUID ]);
  }

  onPart(dataJSON: string) {
    const data = JSON.parse(dataJSON);
  }
}

window.client = new Client();
window.cli = chatService;
