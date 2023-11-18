import { Channel } from './channel';
import type { Conversation } from './conversation';
import { User, UserChannelRole, UserSiteRole } from './user';
import type { ChannelDetails } from './channel';
import type { UserDetails } from './user';
import { ReturnCode } from './return-code';
import type { UserStatus } from './user-status';

import socket from './ws';
import { reactive } from 'vue';

class Client {
  private me_?: User;
  private channelsByUUID_: Map<string, Channel>;
  private channelsByName_: Map<string, Channel>;
  private conversationsByUUID_: Map<string, Conversation>;
  private usersByName_: Map<string, User>;
  private usersByUUID_: Map<string, User>;
  //private watchs_: Set<User>;

  constructor() {
    this.channelsByUUID_ = new Map<string, Channel>();
    this.channelsByName_ = new Map<string, Channel>();
    this.usersByName_ = new Map<string, User>();
    this.usersByUUID_ = new Map<string, User>();
    this.conversationsByUUID_ = new Map<string, Conversation>();
    //this.watchs_ = new Set<User>();

    socket.on('reterr', this.onRetErr.bind(this));
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
    //
  }

  onRetErr(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    console.log("onRetErr:", data);
  }

  onConvopen(dataJSON: string): void {
  }

  onPassword(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    const channel = this.getChannelByUUID(data.channelUUID);
    const user = this.getUserByUUID(data.userUUID);

    if (!channel)
      throw new Error("onPassword: Protocol error");
      //channel.password = data.password;
	  console.log('channel password', data);
  }

  onBan(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    const channel = this.getChannelByUUID(data.channelUUID);
    const user = this.getUserByUUID(data.userUUID);
    const bannedUser = this.getUserByUUID(data.targetUserUUID);

		if (!channel) throw new Error("onBan: Channel not exists");
		if (!bannedUser) throw new Error("onBan: Banned user not exists");

    channel.addBan(bannedUser);
    if (bannedUser === this.me_) {
      this.deleteChannel_(channel);
    }
    console.log('ban', data);
  }

  onUnban(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    const channel = this.getChannelByUUID(data.channelUUID);
    const user = this.getUserByUUID(data.userUUID);
    const unbannedUser = this.getUserByUUID(data.targetUserUUID);

    if (!channel) throw new Error("onUnban: Channel not exists");
	  if (!unbannedUser) throw new Error("onUnban: Unbanned user not exists");

    channel.removeBan(unbannedUser);
    console.log('unban', data);
  }

  onMute(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    const channel = this.getChannelByUUID(data.channelUUID);
    const user = this.getUserByUUID(data.userUUID);
    const mutedUser = this.getUserByUUID(data.targetUserUUID);

		if (!channel) throw new Error("onMute: Channel not exists");
		if (!mutedUser) throw new Error("onMute: Muted user not exists");

    channel.addMute(mutedUser);
    console.log('mute', data);
  }

  onUnmute(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    const channel = this.getChannelByUUID(data.channelUUID);
    const user = this.getUserByUUID(data.userUUID);
    const unmutedUser = this.getUserByUUID(data.targetUserUUID);

		if (!channel) throw new Error("onUnmute: Channel not exists");
		if (!unmutedUser) throw new Error("onUnmute: Unmuted user not exists");

    channel.removeMute(unmutedUser);
    console.log('unmute', data);
  }

  onPromote(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    const channel = this.getChannelByUUID(data.channelUUID);
    const user = this.getUserByUUID(data.userUUID);
    const promotedUser = this.getUserByUUID(data.targetUserUUID);

		if (!channel) throw new Error("onPromote: Channel not exists");
		if (!promotedUser) throw new Error("onPromote: Promoted user not exists");

    channel.addOper(promotedUser);
    console.log('promote', data);
  }

  onDemote(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    const channel = this.getChannelByUUID(data.channelUUID);
    const demotedUser = this.getUserByUUID(data.targetUserUUID);

		if (!channel) throw new Error("onDemote: Channel not exists");
		if (!demotedUser) throw new Error("onDemote: Demoted user not exists");

    channel.removeOper(demotedUser);
    console.log('demote', data);
  }

  onJoin(dataJSON: string): void {
    const data = JSON.parse(dataJSON)
    const channel = this.getChannelByUUID(data.channel.uuid);
    let user = this.getUserByUUID(data.user.uuid);

		if (!channel) throw new Error("onJoin: Channel not exists");
      if (!user)
        user = this.createUser_(data.user);
    channel.addUser(user);
    user.addChannel(channel);
    console.log('join', data);
    //console.log(`${nick} ha entrado en ${channel}`);
  }

  onPart(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    const channel = this.getChannelByUUID(data.channelUUID);
    const user = this.getUserByUUID(data.userUUID);

		if (!channel) throw new Error("onPart: Channel not exists");
		if (!user) throw new Error("onPart: User not exists");

    channel.removeUser(user);
    user.removeChannel(channel);
    //Si yo recibo este evento es porque aun sigo en el canal, el canal no se borra
    //Otra cosa es que el usuario ya no tenga más canales, entonces lo tengo que borrar
    if (user.hasNoChannels)
      this.deleteUser_(user);
    if (channel.hasNoUsers)
      this.deleteChannel_(channel);
    console.log('part', data);
  }

  onKick(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    const channel = this.getChannelByUUID(data.channelUUID);
    const user = this.getUserByUUID(data.userUUID);
    const kickedUser = this.getUserByUUID(data.targetUserUUID);

		if (!channel) throw new Error("onKick: Channel not exists");
		if (!kickedUser) throw new Error("onKick: Kicked user not exists");

    channel.removeUser(kickedUser);
    kickedUser.removeChannel(channel);

    if (!kickedUser.getChannelsCount())
      this.deleteUser_(kickedUser);
    console.log('kick', data);
  }

  onTopic(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    const channel = this.getChannelByUUID(data.channelUUID);

		if (!channel) throw new Error("onTopic: Channel not exists"	);

		channel.topic = data.topic;
    console.log('topic', data);
  }

  onRegister(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    this.me_ = new User(data);
    console.log(`Welcome, your uuid is ${this.me_.uuid} and user is ${this.me_.name}`);
  }

  onName(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    const user = this.getUserByUUID(data.userUUID);

		if (!user) throw new Error("onName: User not exists");

    this.usersByName_.delete(user.name);
    user.name = data.newName;
    this.usersByName_.set(user.name, user);
    console.log('name', data);
  }

  onUpdate(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    const user = this.getUserByUUID(data.userUUID);

    console.log('update', data);

	  if (!user) throw new Error("onUpdate: User not exists");

    if (data.name) user.name = data.name;
    if (data.status) user.status = data.status;
    if (data.siteRole) user.siteRole = data.siteRole;
  }

  onType(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    const user = this.getUserByUUID(data.userUUID);
    const notifyChannel = this.getChannelByUUID(data.notifyChannelUUID);
    const notifyConversation = this.getConversationByUUID(data.targetConversationUUID);

		if (!user) throw new Error("onType: User not exists");

    console.log('type', data);

    if (notifyChannel) {
      if (data.typing)
        console.log('type', user.name, "esta escribiendo en", notifyChannel.name);
      else
        console.log('type', user.name, "ha dejado de escribir en", notifyChannel.name);
    } else if (notifyConversation) {
      if (data.typing)
        console.log('type', user.name, "te está escribiendo");
      else
        console.log('type', user.name, "te ha dejado de escribir");
    }
  }

  onConvmsg(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    const user = this.getUserByUUID(data.userUUID);
    const targetUser = this.getUserByUUID(data.targetUserUUID);

    console.log('convmsg', data);
  }

  onChanmsg(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
    const user = this.getUserByUUID(data.userUUID);
    const targetChannel = this.getChannelByUUID(data.targetChannelUUID);

    console.log('chanmsg', data);
  }

  async block(targetUserUUID: string): Promise<boolean> {
    const result = await this.send('block', [targetUserUUID]);

    if (result.code === ReturnCode.NothingHappened)
      return true;
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }
    return true;
  }

  async unblock(targetUserUUID: string): Promise<boolean> {
    const result = await this.send('unblock', [targetUserUUID]);

    if (result.code === ReturnCode.NothingHappened)
      return true;
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }
    return true;
  }

  async password(channelUUID: string, password: string): Promise<boolean> {
    const result = await this.send('password', [channelUUID, password]);
    let channel: Channel | undefined;

    if (result.code === ReturnCode.NothingHappened)
      return true;
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }
    channel = this.getChannelByUUID(channelUUID);

		if (!channel) throw new Error("password: Channel not exists");

    channel.hasPassword = (password != '');
    return true;
  }

  async ban(channelUUID: string, targetUserUUID: string): Promise<boolean> {
    const result = await this.send('ban', [channelUUID, targetUserUUID]);
    let channel: Channel | undefined;
    let targetUser: User | undefined;

    if (result.code === ReturnCode.NothingHappened)
      return true;
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }
    channel = this.getChannelByUUID(channelUUID);
    targetUser = this.getUserByUUID(targetUserUUID);

	  if (!channel) throw new Error("ban: ChannelUUID not exists");
	  if (!targetUser) throw new Error("ban: UserUUID not exists");

    channel.addBan(targetUser);
    return true;
  }

  async unban(channelUUID: string, targetUserUUID: string): Promise<boolean> {
    const result = await this.send('unban', [channelUUID, targetUserUUID]);
    let channel: Channel | undefined;
    let targetUser: User | undefined;

    if (result.code === ReturnCode.NothingHappened)
      return true;
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }
    channel = this.getChannelByUUID(channelUUID);
    targetUser = this.getUserByUUID(targetUserUUID);

		if (!channel) throw new Error("unban: ChannelUUID not exists");
		if (!targetUser) throw new Error("unban: UserUUID not exists");

    channel.removeBan(targetUser);
    return true;
  }

  async unmute(channelUUID: string, targetUserUUID: string): Promise<boolean> {
    const result = await this.send('unmute', [channelUUID, targetUserUUID]);
    let channel: Channel | undefined;
    let targetUser: User | undefined;

    if (result.code === ReturnCode.NothingHappened)
      return true;
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }
    channel = this.getChannelByName(channelUUID);
    targetUser = this.getUserByName(targetUserUUID);

		if (!channel) throw new Error("unmute: ChannelUUID not exists");
		if (!targetUser) throw new Error("unmute: UserUUID not exists");

    channel.removeMute(targetUser);
    return true;
  }

  async mute(channelUUID: string, targetUserUUID: string): Promise<boolean> {
    const result = await this.send('mute', [channelUUID, targetUserUUID]);
    let channel: Channel | undefined;
    let targetUser: User | undefined;

    if (result.code === ReturnCode.NothingHappened)
      return true
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }
    channel = this.getChannelByUUID(channelUUID);
    targetUser = this.getUserByUUID(targetUserUUID);

		if (!channel) throw new Error("mute: ChannelUUID not exists");
		if (!targetUser) throw new Error("mute: UserUUID not exists");

		channel.addMute(targetUser);
    return true;
  }

  async promote(channelUUID: string, targetUserUUID: string): Promise<boolean> {
    const result = await this.send('promote', [channelUUID, targetUserUUID]);
    let channel: Channel | undefined;
    let targetUser: User | undefined;

    if (result.code === ReturnCode.NothingHappened)
      return true
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }
    channel = this.getChannelByName(channelUUID);
    targetUser = this.getUserByName(targetUserUUID);

	  if (!channel) throw new Error("promote: ChannelUUID not exists");
		if (!targetUser) throw new Error("promote: UserUUID not exists");

    channel.addOper(targetUser);
    return true;
  }

  async demote(channelUUID: string, targetUserUUID: string): Promise<boolean> {
    const result = await this.send('demote', [channelUUID, targetUserUUID]);
    let channel: Channel | undefined;
    let targetUser: User | undefined;

    if (result.code === ReturnCode.NothingHappened)
      return true
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }
    channel = this.getChannelByName(channelUUID);
    targetUser = this.getUserByName(targetUserUUID);

  	if (!channel) throw new Error("demote: ChannelUUID not exists");
		if (!targetUser) throw new Error("demote: UserUUID not exists");

    channel.removeOper(targetUser);
    return true;
  }

  async topic(channelUUID: string, topic: string): Promise<boolean> {
    const result = await this.send('topic', [channelUUID, topic]);
    let channel: Channel;
    let targetUser: User;

    if (result.code === ReturnCode.NothingHappened)
      return true;
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }
    return true;
  }

  async list() {
    const result = await this.send('list');

    console.log(result.data);
    if (result.code === ReturnCode.NothingHappened)
      return true;
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false
    }
  }

  async create(channelName: string, password?: string) {
    this.send('create', [channelName, password]);
    return true;

    let channel: Channel;

    console.log(result.data);
    if (result.code === ReturnCode.NothingHappened)
      return true
    if (result.code !== ReturnCode.Allowed) {
      console.error("Error:", result.message);
      return false;
    }
    channel = this.createChannel_(result.data.channel);
    for (const userDetails of result.data.channel.users) {
      let user = this.getUserByUUID(userDetails.uuid);

      if (!user)
        user = this.createUser_(userDetails);
        channel.addUser(user);
      if (userDetails.channelRole === UserChannelRole.OWNER)
        channel.owner = user;
      if (userDetails.channelRole === UserChannelRole.ADMIN)
        channel.addOper(user);
      user.addChannel(channel);
    }
    return true;
  }

  async join(channelUUID: string, password?: string): Promise<boolean> {
    const result = await this.send('join', [channelUUID, password]);
    let channel: Channel;

    console.log(result.data);
    if (result.code === ReturnCode.NothingHappened)
      return true
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false
    }
    channel = this.createChannel_(result.data.channel);
    for (const userDetails of result.data.channel.users) {
      let user = this.getUserByUUID(userDetails.uuid);

      if (!user)
        user = this.createUser_(userDetails);
      channel.addUser(user);
      if (userDetails.channelRole === UserChannelRole.OWNER)
        channel.owner = user;
      if (userDetails.channelRole === UserChannelRole.ADMIN)
        channel.addOper(user);
      user.addChannel(channel);
      }
    return true;
  }

  async part(channelUUID: string): Promise<boolean> {
    const result = await this.send("part", [channelUUID]);
  //let channel: Channel;

    if (result.code === ReturnCode.NothingHappened)
      return true
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false
    }

    console.log(result.data);
    return true;
  }

  async kick(channelUUID: string, targetUserUUID: string, message?: string): Promise<boolean> {
    const result = await this.send("kick", [channelUUID, targetUserUUID, message]);
    let channel: Channel;
    let user: User;

    if (result.code === ReturnCode.NothingHappened)
      return true;
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:" , result.message);
      return false;
    }

    console.log(result.data);
    return true;
  }

  /*
  async watch(watchedUserName: string) {
    const result = await this.send('watch', [watchedUserName]);

    if (result.code === ReturnCode.NothingHappened)
      return true;
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }

    let watchedUser = this.getUserByUUID(result.data.userDetails.uuid);

    if (!watchedUser)
      watchedUser = this.createUser_(result.data.userDetails);
    this.addWatch(watchedUser);
    console.log(result.data);
    return true;
  }

  async unwatch(userName: string) {
    const result = await this.send('unwatch', [userName]);

    if (result.code === ReturnCode.NothingHappened)
      return true;
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }

    let user = this.getUserByUUID(result.data.userUUID);

    this.removeWatch(user);
    if (user.isEmpty)
      this.deleteUser_(user);
    console.log(result.data);
    return true;
  }
  */

  async status(status: UserStatus) {
    const userDetails: UserDetails = {
      status: status,
    }
    const result = await this.send('update', [ userDetails ]);
    let user: User;

	  if (!this.me_) throw new Error("status: Set status before register");
    if (result.code === ReturnCode.NothingHappened)
      return true;
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }

    this.me_.status = status;
    return true;
  }

  async name(name: string): Promise<boolean> {
    const userDetails: UserDetails = {
      name: name,
    };
    const result = await this.send('update', [ userDetails ]);

    if (result.code === ReturnCode.NothingHappened)
      return true
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }

    return true;
  }

  async typing(typing: boolean, filterUUID: string): Promise<boolean> {
    const userDetails: UserDetails = {
      typing: typing,
    };
    const result = await this.send('type', [ typing, filterUUID ]);

    if (result.code === ReturnCode.NothingHappened)
      return true;
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }

    return true;
  }

  async convmsg(targetUserUUID: string, message: string): Promise<boolean> {
    const result = await this.send('convmsg', [ message, targetUserUUID ]);

    if (result.code === ReturnCode.NothingHappened)
      return true;
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }

    return true;
  }

  async chanmsg(channelUUID: string, message: string): Promise<boolean> {
    const result = await this.send('chanmsg', [ message, channelUUID ]);

    if (result.code === ReturnCode.NothingHappened)
      return true;
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }

    return true;
  }

  async stats(): Promise<boolean> {
    const result = await this.send('stats', []);

    if (result.code === ReturnCode.NothingHappened)
      return true;
    if (result.code !== ReturnCode.Allowed) {
      console.log("Error:", result.message);
      return false;
    }

    console.log(result.data);
    return true;
  }

  get me(): UserDetails | undefined {
	  if (!this.me_) return undefined;
    return this.me_.getDetails();
  }

  get users(): User[] {
    return Array.from(this.usersByName_.values());
  }

  get channels(): Channel[] {
    return Array.from(this.channelsByName_.values());
  }

  getChannelByName(channelName: string): Channel | undefined {
    //if (!this.usersByName_.has(userName))
    //    throw new Error("getChannelByName: Canal no encontrado");
    return this.channelsByName_.get(channelName);
  }

  getChannelByUUID(channelUUID: string): Channel | undefined {
    //if (!this.usersByName_.has(userName))
    //    throw new Error("getChannelByUUID: Canal no encontrado");
    return this.channelsByUUID_.get(channelUUID);
  }

  getUserByName(userName: string): User | undefined {
    //if (!this.usersByName_.has(userName))
    //    throw new Error("getUserByName: Usuario no encontrado");
    return this.usersByName_.get(userName);
  }

  getUserByUUID(userUUID: string): User | undefined {
    //if (!this.usersByUUID_.has(userUUID))
    //    throw new Error("getUserByUUID: Usuario no encontrado");
    return this.usersByUUID_.get(userUUID);
  }

	getConversationByUUID(conversationUUID: string): Conversation | undefined {
		return this.conversationsByUUID_.get(conversationUUID);
	}

  private createUser_(userDetails: UserDetails): User {
    const user = new User(userDetails)

    this.usersByName_.set(user.name, user);
    this.usersByUUID_.set(user.uuid, user);
    return user;
  }

  private createChannel_(channelDetails: ChannelDetails): Channel {
    const channel = new Channel(channelDetails);

    this.channelsByName_.set(channel.name, channel);
    this.channelsByUUID_.set(channel.uuid, channel);

    return channel;
  }

  private deleteUser_(user: User): void {
    this.usersByName_.delete(user.name);
    this.usersByUUID_.delete(user.uuid);
  }

  private deleteChannel_(channel: Channel): void {
    this.channelsByName_.delete(channel.name);
    this.channelsByUUID_.delete(channel.uuid);
    for (const user of channel.getUsersArray()) {
      user.removeChannel(channel);
      if (user.hasNoChannels) this.deleteUser_(user);
    }
  }

  hasUser(user: User): boolean {
    return this.usersByUUID_.has(user.uuid);
  }

  hasChannel(channel: Channel): boolean {
    return this.channelsByUUID_.has(channel.uuid);
  }

  /*
  addWatch(user: User): void {
    this.watchs_.add(user);
  }

  removeWatch(user: User): void {
    this.watchs_.delete(user);
  }

  hasWatch(user: User): boolean {
    return this.watchs_.has(user);
  }
  */

  send(event: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      socket.emit(event, JSON.stringify(data), (response: any) => {
        if (!response)
          reject("Unknown response");
        else
          resolve(JSON.parse(response));
      });
    });/*.then((response) => {
    // console.log("Response:", response);
      return response;
    }).catch((error) => {
      throw new Error(error);
      console.error("Errortio:", error);
      //throw error; // Relanzar la excepción para que pueda ser capturada fuera del método decorado si es necesario
   });*/
  }
}

function withSend(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const event = propertyKey; // Obtener el nombre del método

   // console.log("event: ", event, " args: ", ...args);
    // Llamar a socketInstance.emit con el nombre del evento y los argumentos
    const promise = new Promise((resolve, reject) => {
      socket.emit(event, JSON.stringify(args), (response: any) => {
        const obj = JSON.parse(response);

        if (obj.code === 0) {
          resolve(obj);
        } else {
          reject(obj);
        }
      });
    });

    return promise.then((response) => {
     // console.log("Response:", response);
      return response;
    }).catch((error) => {
      console.error("Error:", error);
      //throw error; // Relanzar la excepción para que pueda ser capturada fuera del método decorado si es necesario
    });
  };

  return descriptor;
}

window.client = new Client();
