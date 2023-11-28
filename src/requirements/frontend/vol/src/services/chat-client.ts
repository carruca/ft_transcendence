import {
  ref,
  readonly,
  reactive,
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
  ChannelSummmaryDTO,
} from './dto';

import {
  UserPayload,
  ChannelPayload,
} from './interface';

import {
  v4 as uuidv4,
} from 'uuid';

import socket from './ws';

import router from '@/router';

import './client';



class ChatClient {
  private me_: User;
  private channels_: Map<string, Channel> = reactive(new Map());
  private users_: Map<string, User> = reactive(new Map());

  private channelsSummary_ = ref<ChannelSummaryDTO[]>([]);
  public channelsSummary = readonly(this.channelsSummary_);

  private userChannelList_ = ref<Channel[]>([]);
  public userChannelList = readonly(this.userChannelList_);

  private userCurrentChannel_ = ref<Channel | null>(null);
  public userCurrentChannel = readonly(this.userCurrentChannel_);

  private adminChannelList_ = ref<Channel[]>([]);
  public adminChannelList = readonly(this.adminChannelList_);

  private adminUserList_ = ref<User[]>([]);
  public adminUserList = readonly(this.adminUserList_);

  private adminCurrentChannel_ = ref<Channel | null>(null);
  public adminCurrentChannel = readonly(this.adminCurrentChannel_);

  private adminCurrentUser_ = ref<User | null>(null);
  public adminCurrentUser = readonly(this.adminCurrentUser_); 

  constructor() {
    this.setupSocketEventHandlers_();
  }

  private getChannelById_(channelId: string): Channel {
    return this.channels_.get(channelId); 
  }

  private getUserById_(userId: string): User {
    return this.users_.get(userId);
  }

  public getChannelUserById(channelId: string, userId: string): ChannelUser | undefined {
    const channel = this.getChannelById_(channelId);
    if (!channel) return undefined;
  
    const user = this.getUserById_(userId);
    if (!user) return undefined;
  
    return channel?.user(user);
  }

  get me() {
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
    socket.on('list', this.onList.bind(this));
    socket.on('adminData', this.onAdminData.bind(this));
    socket.on('watch', this.onWatch.bind(this));

    socket.on('challengeRequested', this.onChallengeRequested.bind(this));
    socket.on('challengeRejected', this.onChallengeRejected.bind(this));
    socket.on('challengeAccepted', this.onChallengeAccepted.bind(this));

    socket.on('channelCreated', this.onChannelCreated.bind(this));
    socket.on('channelUpdated', this.onChannelUpdated.bind(this));
    socket.on('channelDeleted', this.onChannelDeleted.bind(this));

    socket.on('userCreated', this.onUserCreated.bind(this));
    socket.on('userUpdated', this.onUserUpdated.bind(this));
    socket.on('userDeleted', this.onUserDeleted.bind(this));

    socket.on('userJoined', this.onUserJoined.bind(this));
    socket.on('userParted', this.onUserParted.bind(this));

    socket.on('channelEventCreated', this.onChannelEventCreated.bind(this));
    //socket.on('channelEventUpdated', this.onChannelEventUpdated.bind(this));

    socket.on('userChannelCreated', this.onUserChannelCreated.bind(this));
    socket.on('userChannelUpdated', this.onUserChannelUpdated.bind(this));
    socket.on('userChannelDeleted', this.onUserChannelDeleted.bind(this));
  }

  private onList(responseJSON: string): void {
    const channelsDTO = JSON.parse(responseJSON);

    this.channelsSummary_.value = channelsDTO; //.map(item => item.name);
    console.log("userChannelsDTO", this.channelsSummary_.value);
  }

  private onAdminData(responseJSON: string): void {
    const [ channelsDTO, usersDTO ] = JSON.parse(responseJSON);

    this.adminChannelList_.value = channelsDTO;
    this.adminUserList_.value = usersDTO;
    console.log("onAdminData channels", this.adminChannelList_.value);
    console.log("onAdminData users", this.adminUserList_.value);
  }

  private onChallengeAccepted(responseJSON: string): void {
    const { sourceUserId, gameMode } = JSON.parse(responseJSON);
    const sourceUser = this.getUserById_(sourceUserId);
  
    //TODO: modal notify?? ... change browser route to game
    router.push('/game');
  }

  private onChallengeRejected(responseJSON: string): void {
    const { sourceUserId, gameMode } = JSON.parse(responseJSON);
    const sourceUser = this.getUserById_(sourceUserId);

    //TODO: modal notify game reject 
  }

  private onChallengeRequested(responseJSON: string): void {
    const { sourceUserId, gameMode } = JSON.parse(responseJSON);
    const sourceUser = this.getUserById_(sourceUserId);

    //TODO: modal notify with user and game mode.
    console.log("onChallengeRequested", sourceUser.nickname, sourceUser.id);
  }

  private onWatch(responseJSON: string): void {
    const [ targetUser ] = JSON.parse(responseJSON);

    this.addUserFromDTO_(targetUser);
  }

  private onUserJoined(responseJSON: string): void {
    const { channelId, sourceChannelUserDTO } = JSON.parse(responseJSON);
    const channel = this.getChannelById_(channelId);
    const sourceChannelUser = this.channelUserFromDTO_(sourceChannelUserDTO);

    this.addChannelUserToChannel_(channel, sourceChannelUser);
  }

  private onUserParted(responseJSON: string): void {
    const { channelId, sourceUserId } = JSON.parse(responseJSON);
    const channel = this.getChannelById_(channelId);
    const sourceUser = this.getUserById_(sourceUserId);

    this.delUserFromChannel_(channel, sourceUser);
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
    this.updateUserChannelList_();
    this.userCurrentChannel_.value = this.userChannelList.value[0];
  }

  updateUserChannelList_(): void {
    this.userChannelList_.value = Array.from(this.me_.channels.values());
  }

  private manageDestroyedChannelSelection_(channel: Channel) {
    if (this.userCurrentChannel_.value === channel) {
      if (this.userChannelList.value.length)
        this.userCurrentChannel_.value = this.userChannelList.value[0];
      else
        this.userCurrentChannel_.value = undefined;
    }
  }

  private onChannelCreated(dataJSON: string) {
    const channelDTO = JSON.parse(dataJSON);

    console.log('onChannelCreated', channelDTO);
    this.addChannelFromDTO_(channelDTO)
    this.updateUserChannelList_();
  }

  private onChannelUpdated(dataJSON: string) {
    const { channelId, userId, ...changes} = JSON.parse(dataJSON);
    const channel = this.getChannelById_(channelId);
    const user = this.getUserById_(userId);


    console.log('onChannelUpdated', data); 
    channel.update(changes, user);
  }

  private onChannelDeleted(dataJSON: string) {
    const channelId = JSON.parse(dataJSON);
    const channel = this.getChannelById_(channelId);

    console.log('onChannelDeleted', channelId);
    this.deleteChannel_(channel);
    this.updateUserChannelList_();
    this.manageDestroyedChannelSelection_(channel);
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
    console.log(sourceUser);
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

    if (userDTO.channels) {
      for (const channelDTO of userDTO.channels) {
        this.addChannelFromDTO_(channelDTO);
      }
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
    this.userCurrentChannel_.value = channel;
    return channel;
  }

  public chanmsg(channelId: string, message: string) {
    socket.emit('chanmsg', JSON.stringify([ channelId, message ]));
  }

  public create(channelName: string, password?: string) {
    socket.emit('create', JSON.stringify([ channelName, password === "" ? undefined : password ]));
  }

  public join(channelId: string, password?: string) {
    socket.emit('join', JSON.stringify([ channelId, password ]));
  }

  public part(channelId: string) {
    socket.emit('part', JSON.stringify([ channelId ]));
  }

  public close(channelId: string) {
    socket.emit('close', JSON.stringify([ channelId ]));
  }

  public kick(channelId: string, userId: string, message?: string) {
    socket.emit('kick', JSON.stringify([ channelId, userId, message ]));
  }

  public ban(channelId: string, userId: string) {
    socket.emit('ban', JSON.stringify([ channelId, userId ]));
  }

  public unban(channelId: string, userId: string) {
    socket.emit('unban', JSON.stringify([ channelId, userId ]));
  }

  public promote(channelId: string, userId: string) {
    socket.emit('promote', JSON.stringify([ channelId, userId ]));
  }

  public demote(channelId: string, userId: string) {
    socket.emit('demote', JSON.stringify([ channelId, userId ]));
  }

  public password(channelId: string, password?: string) {
    socket.emit('password', JSON.stringify([ channelId, password ]));
  }

  public mute(channelId: string, userId: string) {
    socket.emit('mute', JSON.stringify([ channelId, userId ]));
  }

  public unmute(channelId: string, userId: string) {
    socket.emit('unmute', JSON.stringify([ channelId, userId ]));
  }

  public topic(channelId: string, topic: string) {
    socket.emit('topic', JSON.stringify([ channelId, topic ]));
  }

  public block(userId: string) {
    socket.emit('block', JSON.stringify([ userId ]));
  }

  public unblock(userId: string) {
    socket.emit('unblock', JSON.stringify([ userId ]));
  }

  public challengeRequest(userId: string, gameMode?: GameMode) {
    socket.emit('challengerequest', JSON.stringify([ userId, gameMode ]));
  }

  public challengeAccept(userId: string, gameMode?: GameMode) {
    socket.emit('challengeaccept', JSON.stringify([ userId, gameMode ]));
  }

  public challengeReject(userId: string) {
    socket.emit('challengereject', JSON.stringify([ userId ]));
  }

  public spectate(userId: string) {
    socket.emit('spectate', JSON.stringify([ userId ]));
  }

  public list() {
    socket.emit('list');
  }

  public adminWatch() {
    socket.emit('adminwatch');
  }

  public adminUnwatch() {
    socket.emit('adminunwatch');
    this.adminChannelList_.value = [];
    this.adminUserList_.value = [];
  }

  public setUserCurrentChannel = (channelId: string): void => {
    if (this.channels_.has(channelId)) {
      this.userCurrentChannel_.value = this.me_.channels.get(channelId) || undefined;
    }
  }

  public setAdminCurrentChannel = (channelId: string): void => {
    const channel = this.adminChannelList_.find(channel => channel.id === channelId);

    if (channel) {
      this.adminCurrentChannel_.value = channel;
    }
  }

  public addChannelUserToChannel_(channel: Channel, channelUser: User) {
    channel.addUser(channelUser);
  }

  //Sin uso?
  public delUserFromChannel_(channel: Channel, user: User) {
    channel.delUser(user);
  }

  private addChannel_(channel: Channel) {
    this.channels_.set(channel.id, channel);
    this.userChannelList_.value = Array.from(this.channels_.values());
  }

  private deleteChannel_(channel: Channel) {
    channel.clear();
    this.channels_.delete(channel.id);
    this.userChannelList_.value = Array.from(this.channels_.values());
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

