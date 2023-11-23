import socket from './ws';
import { client } from './chat-client';

class Client {
    get me() {
        return client.me;
    }

    get channels() {
        return client.channels;
    }

    get users() {
        return client.users;
    }

    private send_(event: string, data: any) {
        socket.emit(event, JSON.stringify(data));
    }

    public create(channelName: string, password?: string) {
        this.send_('create', [ channelName, password ]);
    }

    public join(channelUUID: string, password?: string) {
        this.send_('join', [ channelUUID, password ]);
    }

    public part(channelUUID: string) {
        this.send_('part', [ channelUUID ]);
    }

    public kick(channelUUID: string, targetUserUUID: string, message: string) {
        this.send_('kick', [ channelUUID, targetUserUUID, message ]);
    }

    public close(channelUUID: string, message?: string) {
        this.send_('close', [ channelUUID, message ]);
    }

    public ban(channelUUID: string, targetUserUUID: string) {
        this.send_('ban', [ channelUUID, targetUserUUID ]);
    }

    public unban(channelUUID: string, targetUserUUID: string) {
        this.send_('unban', [ channelUUID, targetUserUUID ]);
    }

    public promote(channelUUID: string, targetUserUUID: string) {
        this.send_('promote', [ channelUUID, targetUserUUID ]);
    }

    public demote(channelUUID: string, targetUserUUID: string) {
        this.send_('demote', [ channelUUID, targetUserUUID ]);
    }

    public topic(channelUUID: string, value: string) {
        this.send_('topic', [ channelUUID, value ]);
    }

    public password(channelUUID: string, value: string) {
        this.send_('password', [ channelUUID, value ]);
    }

    public block(targetUserUUID: string) {
        this.send_('block', [ targetUserUUID ]);
    }

    public unblock(targetUserUUID: string) {
        this.send_('unblock', [ targetUserUUID ]);
    }

    public requestChallenge(targetUserUUID: string, gameMode: GameMode) {
        this.send_('challengerequest', [ targetUserUUID, gameMode ]);
    }

    public acceptChallenge(targetUserUUID: string) {
        this.send_('challengeaccept', [ targetUserUUID ]);
    }

    public rejectChallenge(targetUserUUID: string) {
        this.send_('challengereject', [ targetUserUUID ]);
    }

    public observeUser(targetUserUUID: string) {
        this.send_('userobserve', [ targetUserUUID ]);
    }

    public list() {
        this.send_('list');
    }

    public chanmsg(channelUUID: string, message: string) {
        this.send_('chanmsg', [ channelUUID, message ]);
    }

    public privmsg(targetUserUUID: string, message: string) {
        this.send_('privmsg', [ targetUserUUID, message ]);
    }
}

window.c = new Client();
