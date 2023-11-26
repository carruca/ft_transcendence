import {
  ref,
  readonly,
} from 'vue';

import {
  Channel,
  ChannelUser,
  User,
  Event,
} from './model';

import {
  EventTypeEnum,
  UserSiteRoleEnum,
} from './enum';

import {
  //UserDTO,
  ChannelDTO,
} from './dto';

import {
  UserPayload,
  ChannelPayload,
} from './interface';

import {
  v4 as uuidv4,
} from 'uuid';

import socket from './ws';

import './client';

class ChatClient {
  private me_: User;
  private channels_: Map<string, Channel> = new Map();
  private users_: Map<string, User> = new Map();

  private channelList_ = ref<Channel[]>([]);
  public channelList = readonly(this.channelList_);

  private currentChannel_ = ref<Channel | null>(null);
  public currentChannel = readonly(this.currentChannel_);

  constructor() {
    this.setupSocketEventHandlers_();
  }

  private getChannelById_(channelId: string): Channel {
    return this.channels_.get(channelId); 
  }

  private getUserById_(userId: string): User {
    return this.users_.get(userId);
  }

  get me() {
    console.log(this.channels_);
    return this.me_;
  }

  get channels() {
    return this.channels_;
  }

  get users() {
    return Array.from(this.users_.values());
  }
  private setupSocketEventHandlers_() {
    socket.on('reterror', this.onRetError.bind(this));
    socket.on('retsuccess', this.onRetSuccess.bind(this));
    socket.on('registered', this.onRegistered.bind(this));

    socket.on('channelCreated', this.onChannelCreated.bind(this));
    socket.on('channelUpdated', this.onChannelUpdated.bind(this));
    socket.on('channelDeleted', this.onChannelDeleted.bind(this));

    socket.on('userCreated', this.onUserCreated.bind(this));
    socket.on('userUpdated', this.onUserUpdated.bind(this));
    socket.on('userDeleted', this.onUserDeleted.bind(this));

    socket.on('channelEventCreated', this.onChannelEventCreated.bind(this));
    //socket.on('channelEventUpdated', this.onChannelEventUpdated.bind(this));

    socket.on('userChannelCreated', this.onUserChannelCreated.bind(this));
    socket.on('userChannelUpdated', this.onUserChannelUpdated.bind(this));
    socket.on('userChannelDeleted', this.onUserChannelDeleted.bind(this));
  }

  private onRetError(responseJSON: string): void {
    const response = JSON.parse(responseJSON);

    console.log(`%cError: ${response.message}`, "color: red;");
  }

  private onRetSuccess(responseJSON: string): void {
    const response = JSON.parse(responseJSON);

    console.log(`%cSuccess: ${response.event}`, "color: green;");
  }

  private onRegistered(responseJSON: string): void {
    const meUserDTO = JSON.parse(responseJSON);

    //TODO: Aquí lo que llega es la información de nuestro usuario, eso contempla
    //todos los canales y de estos, los usuarios y los eventos.
    this.me_ = this.addUserFromDTO_(meUserDTO);
    //meUserDTO.channels.map((channelDTO: ChannelDTO) => this.me_.channels.set(channelDTO.id, this.addChannel_(this.channelFromDTO_(channelDTO))));


    console.log(`%cSuccess: Your id is '${this.me_.id}' and '${this.me_.nickname}' is your nick. You are in ${this.me_.channels.size} channels`, "color: green;");

    console.log(this.me_.channels.values());
    for (const channel of this.me_.channels.values()) {
      console.log(`${channel.name}: ${channel.id}`);
      console.log('users', channel.users);
    }
    //console.log(meUserDTO);
    this.channelList_.value = Array.from(this.me_.channels.values());
    this.updateChannelList_();
  }

  updateChannelList_(): void {
    this.currentChannel_.value = this.channelList.value[0]; //this.me_.channels.values().next().value;
  }



  private onChannelCreated(dataJSON: string) {
    const channelDTO = JSON.parse(dataJSON);

    console.log('onChannelCreated', channelDTO);
    this.addChannelFromDTO_(channelDTO)
    this.updateChannelList_();
  }

  private onChannelUpdated(dataJSON: string) {
    const data = JSON.parse(dataJSON);

    console.log('onChannelUpdated', data);
  }

  private onChannelDeleted(dataJSON: string) {
    const channelId = JSON.parse(dataJSON);
    const channel = this.getChannelById_(channelId);

    console.log('onChannelDeleted', channelId);
    this.deleteChannel_(channel);
    this.updateChannelList_();
  }

  private onUserCreated(dataJSON: string) {
    const data = JSON.parse(dataJSON);

    console.log('onUserCreated', data);
  }

  private onUserUpdated(dataJSON: string) {
    const { sourceUserId, changes } = JSON.parse(dataJSON);
    const sourceUser = this.getUserById_(sourceUserId);
   
    console.log('onUserUpdated', changes);
    if (sourceUser) {
      sourceUser.update(changes);
    }
  }

  private onUserDeleted(dataJSON: string) {
    const data = JSON.parse(dataJSON);

    console.log('onUserDeleted', data);
  }

  private onEventCreated(dataJSON: string) {
    const data = JSON.parse(dataJSON);

    console.log('onEventCreated', data);
  }

  private onEventUpdated(dataJSON: string) {
    const data = JSON.parse(dataJSON);

    console.log('onEventUpdated', data);
  }

  private onUserChannelCreated(dataJSON: string) {
    const data = JSON.parse(dataJSON);

    console.log('onUserChannelCreated', data);
  }

  private onUserChannelUpdated(dataJSON: string) {
    const data = JSON.parse(dataJSON);

    console.log('onUserChannelUpdated', data);
  }

  private onUserChannelDeleted(dataJSON: string) {
    const data = JSON.parse(dataJSON);

    console.log('onUserChannelDeleted', data);
  }

  private onChannelEventCreated(dataJSON: string) {
    const { channelId, eventDTO } = JSON.parse(dataJSON);

    const event = this.eventFromDTO_(eventDTO)
    const channel = this.getChannelById_(channelId);

    if (channel)
      channel.addEvent(event); 
  }

  private addUserFromDTO_(userDTO: UserDTO): User {
    let user = this.getUserById_(userDTO.id);
    let channel: Channel;
    let channelUser: ChannelUser[];

    if (!user) {
      user = this.userFromDTO_(userDTO);
      this.addUser_(user);
    }

    for (const channelDTO of userDTO.channels) {
      this.addChannelFromDTO_(channelDTO);
    }
    return user;
  }

  private channelFromDTO_(channelDTO: ChannelDTO): Channel {
    let ownerUser = this.getUserById_(channelDTO.ownerDTO.id);

    if (!ownerUser) {
      ownerUser = this.userFromDTO_(channelDTO.ownerDTO);
      this.addUser_(ownerUser);
    }

    return new Channel({
      id: channelDTO.id,
      name: channelDTO.name,
      owner: ownerUser,
      createdDate: channelDTO.createdDate,
      password: channelDTO.password,
    });
  }

  private userFromDTO_(userDTO: UserDTO): User {
    return new User({
      id: userDTO.id,
      nickname: userDTO.nickname,
      siteRole: userDTO.siteRole,
      status: userDTO.status,
      blocked: userDTO.blocked,
      friend: userDTO.friend,
    });
  }

  private channelUserFromDTO_(channelUserDTO: ChannelUserDTO): ChannelUser {
    let user = this.getUserById_(channelUserDTO.userDTO.id);
    
    if (!user) {
      user = this.userFromDTO_(channelUserDTO.userDTO);
      this.addUser_(user);
    }

    return new ChannelUser({
      user: user,
      admin: channelUserDTO.admin,
      owner: channelUserDTO.owner,
      muted: channelUserDTO.muted,
      banned: channelUserDTO.banned,
    });
  }

  private eventFromDTO_(eventDTO: EventDTO): Event {
    //let sourceUser = this.getUserById_(eventDTO.sourceId);
    //let targetUser = this.getUserById_(eventDTO.targetId);

    return new Event({
      id: eventDTO.id,
      type: eventDTO.type,
      timestamp: eventDTO.timestamp,
      modified: eventDTO.modified,
      sourceId: eventDTO.sourceId,
      targetId: eventDTO.targetId,
      sourceNickname: eventDTO.sourceNickname,
      targetNickname: eventDTO.targetNickname,
      value: eventDTO.value,
    }); 
  }

  private addChannelFromDTO_(channelDTO: ChannelDTO): Channel {
    const channelUsers: ChannelUser[] = [];
    const events: Event[] = [];
    let channel = this.getChannelById_(channelDTO.id);

    for (const channelUserDTO of channelDTO.channelUsersDTO) {
      channelUsers.push(this.channelUserFromDTO_(channelUserDTO));
    }
    for (const eventDTO of channelDTO.eventsDTO) {
      events.push(this.eventFromDTO_(eventDTO));
    }
    if (!channel) {
      channel = this.channelFromDTO_(channelDTO);
      this.addChannel_(channel);
    }
 
    channel.addUsers(channelUsers);
    channel.addEvents(events);
    return channel;
  }

  public deleteUser(user: User) {
  }

  public createChannel(name: string, ownerUser: User, password?: boolean): Channel {
  }

  public closeChannel(channel: Channel, sourceUser: User) {
  }

  public ban(channel: Channel, sourceUser: User, targetUser: User) {
  }

  public unban(channel: Channel, sourceUser: User, targetUser: User) {
  }

  public mute(channel: Channel, sourceUser: User, targetUser: User) {
  }

  public unmute(channel: Channel, sourceUser: User, targetUser: User) {
  }

  public promote(channel: Channel, sourceUser: User, targetUser: User) {
  }

  public demote(channel: Channel, sourceUser: User, targetUser: User) {
  }

  public kick(channel: Channel, sourceUser: User, targetUser: User) {
  }

  public join(channel: Channel, sourceUser: User) {
  }

  public part(channel: Channel, sourceUser: User) {
  }

  public chanmsg(channel: Channel, sourceUser: User, message: string) {
  }

  public privmsg(targetUser: User, sourceUser: User, message: string) {
  }

  public setCurrentChannel = (channelId: string): void => {
    if (this.channels_.has(channelId)) {
      this.currentChannel_.value = this.me_.channels.get(channelId) || undefined;
    }
  }

  //Sin uso?
  public addUserToChannel_(channel: Channel, user: User, props: ChannelUserProperties): ChannelUser {
    const newChannelUser = new ChannelUser(user, props);
    channel.addUser(newChannelUser);
    return newChannelUser;
  }

  //Sin uso?
  public delUserFromChannel_(channel: Channel, user: User) {
    channel.users.delete(user.id);
  }

  private addChannel_(channel: Channel) {
    this.channels_.set(channel.id, channel);
    this.channelList_.value = Array.from(this.channels_.values());
  }

  private deleteChannel_(channel: Channel) {
    channel.clear();
    this.channels_.delete(channel.id);
    this.channelList_.value = Array.from(this.channels_.values());
  }

  private deleteChannelId_(channelId: string) {
    const channel = this.getChannelById_(channelId);

    if (channel)
      this.deleteChannel_(channel);
  }

  private addUser_(user: User) {
    this.users_.set(user.id, user);
  }

  private deleteUser_(user: User) {
    user.clear();
    this.users_.delete(user.id);
  }

  private deleteUserId_(userId: string) {
    const user = this.getUserById_(userId);

    if (user)
      this.deleteUser_(user);
  }
}

export const client = new ChatClient();

