import {
  ref,
  readonly,
  reactive,
  watch,
} from 'vue';

import {
  Channel,
  ChannelUser,
  User,
  Event,
  Private,
} from './model';

import {
  EventTypeEnum,
  UserSiteRoleEnum,
} from './enum';

import {
  UserDTO,
  EventDTO,
  ChannelDTO,
  ChannelUserDTO,
  ChannelSummaryDTO,
} from './dto';

import {
  UserPayload,
  ChannelPayload,
} from './interface';

import socket from './ws';

import router from '@/router';

import { Client } from './client';


export class ChatClient {
  static instance: ChatClient;
  private _client: Client;

  constructor() {
    if (ChatClient.instance)
      return ChatClient.instance;
    this.setupSocketEventHandlers_();
    this._client = Client.getInstance();
    ChatClient.instance = this;
    return ChatClient.instance;
  }

  static getInstance() {
    if (!ChatClient.instance) {
      ChatClient.instance = new ChatClient();
    }
    return ChatClient.instance;
  }

  private me_ = ref<User>(undefined);

  private users_: Map<string, User> = reactive(new Map());
  private channels_: Map<string, Channel> = reactive(new Map());
  private privates_: Map<string, Private> = reactive(new Map());

  private adminUsers_: Map<string, User> = reactive(new Map());
  private adminChannels_: Map<string, Channel> = reactive(new Map());

  private userWatchCallback_?: Function;

  private isConnected_ = ref<boolean>(false);
  public isConnected = readonly(this.isConnected_);

  private channelsSummary_ = ref<ChannelSummaryDTO[]>([]);
  public channelsSummary = readonly(this.channelsSummary_);

  private userChannelList_ = ref<Channel[]>([]);
  public userChannelList = readonly(this.userChannelList_);

  private userCurrentChannel_ = ref<Channel | null>(null);
  public userCurrentChannel = readonly(this.userCurrentChannel_);

  private userCurrentChannelBanList_ = reactive(new Map<User>);
  public userCurrentChannelBanList = readonly(this.userCurrentChannelBanList_);

  private privateList_ = ref<Private[] | null>([]);
  public privateList = readonly(this.privateList_);

  private currentPrivate_ = ref<Private | null>(null);
  public currentPrivate = readonly(this.currentPrivate_);

  private adminChannelList_ = ref<Channel[]>([]);
  public adminChannelList = readonly(this.adminChannelList_);

  private adminUserList_ = ref<User[]>([]);
  public adminUserList = readonly(this.adminUserList_);

  private adminCurrentChannel_ = ref<Channel | null>(null);
  public adminCurrentChannel = readonly(this.adminCurrentChannel_);

  private adminCurrentUser_ = ref<User | null>(null);
  public adminCurrentUser = readonly(this.adminCurrentUser_);

  private showModal_ = ref<boolean>(false);
  public showModal = readonly(this.showModal_);

  private toastMessage_ = ref<string>(undefined);
  public toastMessage = readonly(this.toastMessage_);

  private modalProps_ = ref({
    title: undefined,
    onAccept: undefined,
    onReject: undefined,
    acceptText: 'Accept',
    rejectText: 'Reject',
    content: undefined
  });
  public modalProps = readonly(this.modalProps_);

  private admin_: boolean;

  private getChannelById_(channelId: string): Channel | undefined {
    return this.channels_.get(channelId);
  }

  public getUserById(userId: string): User | undefined {
    return this.users_.get(userId);
  }

  public getChannelUserById(channelId: string, userId: string): ChannelUser | undefined {
    const channel = this.getChannelById_(channelId);
    if (!channel) return undefined;

    const user = this.getUserById(userId);
    if (!user) return undefined;

    return channel?.user(user);
  }

  public getPrivateById(userId: string): Private | undefined {
    return this.privates_.get(userId);
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

  get privs() {
    return Array.from(this.privates_);
  }


  private setupSocketEventHandlers_() {
    socket.on('error', this.onError.bind(this));
    socket.on('reterror', this.onRetError.bind(this));
    socket.on('retsuccess', this.onRetSuccess.bind(this));
    socket.on('registered', this.onRegistered.bind(this));
    socket.on('list', this.onList.bind(this));
    socket.on('adminData', this.onAdminData.bind(this));
    socket.on('watch', this.onWatch.bind(this));
    socket.on('privMessage', this.onPrivMessage.bind(this));
    socket.on('unban', this.onUnban.bind(this));

    socket.on('challengeRequested', this.onChallengeRequested.bind(this));
    socket.on('challengeRejected', this.onChallengeRejected.bind(this));
    socket.on('challengeAccepted', this.onChallengeAccepted.bind(this));
    socket.on('challengeSpectated', this.onChallengeSpectated.bind(this));

    socket.on('channelBanList', this.onChannelBanList.bind(this));
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

  private onError(data: any): void {
    this.isConnected_.value = false;
  }

  private onList(responseJSON: string): void {
    const channelsDTO = JSON.parse(responseJSON);

    this.channelsSummary_.value = channelsDTO; //.map(item => item.name);
    console.log("userChannelsDTO", this.channelsSummary_.value);
  }

  private onChannelBanList(responseJSON: string): void {
    const [ channelId, banUsers ] = JSON.parse(responseJSON);

    for (const userDTO of banUsers) {
      this.userCurrentChannelBanList_.set(userDTO.id, new User(userDTO));
    }
  }

  private onUnban(responseJSON: string): void {
    const [ channelId, targetUserId ] = JSON.parse(responseJSON);
    const channel = this.getChannelById_(channelId);

    if (!channel) return;
      this.currentChannelBanList_.value.delete(targetUserId);
/*
    this.currentChannelBanList_.value.fi(user => user.id === targetUserId);

		
		this.userChannelList_.value = Array.from(this.me_.value.channels.values())
			.sort((a, b) => (a as Channel).name.localeCompare((b as Channel).name));
*/  

  }

  private onAdminData(responseJSON: string): void {
    const [ channelsDTO, usersDTO ] = JSON.parse(responseJSON);

    for (const userDTO of usersDTO) {
      const user = this.userFromDTO_(userDTO);
      this.adminUsers_.set(user.id, user);
    }

    for (const channelDTO of channelsDTO) {
      const channel = this.channelFromDTO_(channelDTO);
      const ownerUser = this.adminUsers_.get(channel.owner.id);

      if (ownerUser) {
        channel.owner = ownerUser;
      }
      this.adminChannels_.set(channel.id, channel);
      for (const channelUserDTO of channelDTO.channelUsersDTO) {
        const user = this.adminUsers_.get(channelUserDTO.id);
        if (user) {
          const channelUser = this.channelUserFromDTO_(channelUserDTO, user);
          channel.addUser(channelUser);
        }
      }
    }

    this.adminChannelList_.value = Array.from(this.adminChannels_.values());
    this.adminUserList_.value = Array.from(this.adminUsers_.values());

    console.log("onAdminData channels", this.adminChannelList_.value);
    console.log("onAdminData users", this.adminUserList_.value);
    this.admin_ = true;
  }

  private onChallengeSpectated(responseJSON: string): void {
    const { sourceUserId, gameMode } = JSON.parse(responseJSON);
    const sourceUser = this.getUserById(sourceUserId);

    router.push('/game');
  }

  private onChallengeAccepted(responseJSON: string): void {
    const { sourceUserId, gameMode } = JSON.parse(responseJSON);
    const sourceUser = this.getUserById(sourceUserId);

    router.push('/game');
  }

  private onChallengeRejected(responseJSON: string): void {
    const { sourceUserId, gameMode } = JSON.parse(responseJSON);
    const sourceUser = this.getUserById(sourceUserId);

    this.showModal_.value = false;
  }

  private onChallengeRequested(responseJSON: string): void {
    const { sourceUserId, gameMode } = JSON.parse(responseJSON);
    const sourceUser = this.getUserById(sourceUserId);
    this.showModal_.value = true;

	if (!sourceUser)
	  return;

    this.modalProps_.value = {
      title: 'Challenge Requested',
      onAccept: (() => {
        this.challengeAccept(sourceUserId, gameMode);
        this.showModal_.value = false;
      }),
      onReject: (() => {
        this.challengeReject(sourceUserId);
        this.showModal_.value = false;
      }),
      acceptText: 'Accept',
      rejectText: 'Reject',
      content: `${sourceUser.nickname} has challenged you to a game.`
    };
    const timeout = setTimeout(() => {
      if (this.showModal_.value) {
        this.modalProps_.value.onReject();
      }
      clearTimeout(timeout);
    }, 10000);
    console.log("onChallengeRequested", sourceUser.nickname, sourceUser.id);
  }

  private onWatch(responseJSON: string): void {
    const [ targetUser ] = JSON.parse(responseJSON);

    this.addUserFromDTO_(targetUser);
	if (this.userWatchCallback_) {
	  this.userWatchCallback_(targetUser);
	}
  }

  private onPrivMessage(responseJSON: string): void {
    const [ eventDTO ] = JSON.parse(responseJSON);
    const event = this.eventFromDTO_(eventDTO);

    this.addPrivateEvent_(event);
  }

  private onUserJoined(responseJSON: string): void {
    const { channelId, sourceChannelUserDTO } = JSON.parse(responseJSON);
    const channel = this.getChannelById_(channelId);
    let user = this.getUserById(sourceChannelUserDTO.userDTO.id);
	if (!channel)
		throw new Error(`Channel ${channelId} not found`);
    if (!user) {
      user = this.userFromDTO_(sourceChannelUserDTO.userDTO);
      this.addUser_(user);
    }
    const sourceChannelUser = this.channelUserFromDTO_(sourceChannelUserDTO, user);

    this.addChannelUserToChannel_(channel, sourceChannelUser);
  }

  private onUserParted(responseJSON: string): void {
    const { channelId, sourceUserId } = JSON.parse(responseJSON);
    const channel = this.getChannelById_(channelId);
    const sourceUser = this.getUserById(sourceUserId);

	if (!channel)
	  throw new Error(`Channel ${channelId} not found`);
	if (!sourceUser)
	  throw new Error(`User ${sourceUserId} not found`);
    this.delUserFromChannel_(channel, sourceUser);
  }

  private onRetError(responseJSON: string): void {
    const response = JSON.parse(responseJSON);
    this.toastMessage_.value = response.message;

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
    this.me_.value = this.addUserFromDTO_(meUserDTO);
    //meUserDTO.channels.map((channelDTO: ChannelDTO) => this.me_.channels.set(channelDTO.id, this.addChannel_(this.channelFromDTO_(channelDTO))));


    console.log(`%cSuccess: Your id is '${this.me_.value.id}' and '${this.me_.value.nickname}' is your nick. You are in ${this.me_.value.channels.size} channels`, "color: green;");

    console.log(this.me_.value.channels.values());
    for (const channel of this.me_.value.channels.values()) {
      console.log(`${channel.name}: ${channel.id}`);
      console.log('users', channel.users);
    }
    this.updateUserChannelList_();
    this.userCurrentChannel_.value = this.userChannelList.value[0];
    this.isConnected_.value = true;
  }

updateUserChannelList_(): void {
	if (this.me_.value)
		this.userChannelList_.value = Array.from(this.me_.value.channels.values())
			.sort((a, b) => (a as Channel).name.localeCompare((b as Channel).name));
}

private manageDestroyedChannelSelection_(channel: Channel) {
	if (this.userChannelList.value.length === 0) {
		this.userCurrentChannel_.value = undefined;
	} else if (this.userCurrentChannel_.value === channel) {
		this.userCurrentChannel_.value = this.userChannelList.value[0];
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
    const user = this.getUserById(userId);
    const channelUser = this.getChannelUserById(channelId, userId);

	if (!channel)
	  throw new Error(`Channel ${channelId} not found`);
	if (!user)
	  throw new Error(`User ${userId} not found`);
	if (!channelUser)
	  throw new Error(`ChannelUser ${userId} not found`);

    console.log('onChannelUpdated', channelId, userId, changes);
    channel.update(channelUser, changes);
  }

  private onChannelDeleted(dataJSON: string) {
    const channelId = JSON.parse(dataJSON);
    const channel = this.getChannelById_(channelId);

	if (!channel)
	  throw new Error(`Channel ${channelId} not found`);

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
    let sourceUser = this.getUserById(sourceUserId);

    console.log('onUserUpdated', sourceUserId, changes, sourceUser);
    if (sourceUser) {
      sourceUser.update(changes);
    }

    console.log(sourceUser);
  }

  private userUpdate_(userId: string, chanes: UserDTO) {
    let user;

    if (this.admin_)
      user = this.adminUserList
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
    console.log("addUserFromDTO_", userDTO);
    let user = this.getUserById(userDTO.id);
    let channel: Channel;
    let channelUser: ChannelUser[];

    if (!user) {
      user = this.userFromDTO_(userDTO);
      this.addUser_(user);
    }

    if (userDTO.channelsDTO) {
      for (const channelDTO of userDTO.channelsDTO) {
        console.log("hay canales");
        this.addChannelFromDTO_(channelDTO);
      }
    }
    return user;
  }

  private channelFromDTO_(channelDTO: ChannelDTO): Channel {
    //let ownerUser = this.getUserById(channelDTO.ownerDTO.id);

    //if (!ownerUser) {
      const ownerUser = this.userFromDTO_(channelDTO.ownerDTO);
      //this.addUser_(ownerUser);
    //}

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

  private channelUserFromDTO_(channelUserDTO: ChannelUserDTO, user: User): ChannelUser {
    //let user = this.getUserById(channelUserDTO.userDTO.id);

    //if (!user) {
    //  user = this.userFromDTO_(channelUserDTO.userDTO);
    //  this.addUser_(user);
    //}

    return new ChannelUser({
      user: user,
      admin: channelUserDTO.admin,
      owner: channelUserDTO.owner,
      muted: channelUserDTO.muted,
      banned: channelUserDTO.banned,
    });
  }

  private eventFromDTO_(eventDTO: EventDTO): Event {
    return new Event({
      id: eventDTO.id,
      type: eventDTO.type,
      timestamp: eventDTO.timestamp,
      modified: eventDTO.modified,
	    sourceId: eventDTO.sourceId,
	    sourceNickname: eventDTO.sourceNickname,
	    targetId: eventDTO.targetId,
	    targetNickname: eventDTO.targetNickname,
      value: eventDTO.value,
    });
  }

  private addPrivateEvent_(event: Event): Private {
    let remoteId: string;
    let remoteNickname: string;
	  let priv: Private | undefined;

    if (event.source.id == this.me_.id) {
      remoteId = event.target.id;
      remoteNickname = event.target.name;
    } else {
      remoteId = event.source.id;
      remoteNickname = event.source.name;
    }
  	priv = this.getPrivateById(remoteId);

    if (!priv) {
      priv = this.openPrivate(remoteId, remoteNickname);
  	}

    priv.addEvent(event);
	  return priv;
  }

  private openPrivate(userId: string, userNickname: string): Private {
    const priv = new Private(userNickname);

    this.privates_.set(userId, priv);
    this.privateList_.value = this.privates_.values();
    this.currentPrivate_.value = priv;
    return priv;
  }

  private closePrivate(userId) {
    this.privates_.delete(userId);
    this.privateList_.value = this.privates_.values();
    if (this.currentPrivate_.value.id == userId) {
      this.currentPrivate_ = this.privates_.values().next().value;
    }
  }

  private addChannelFromDTO_(channelDTO: ChannelDTO): Channel {
    const channelUsers: ChannelUser[] = [];
    const events: Event[] = [];
    let channel = this.getChannelById_(channelDTO.id);

    for (const channelUserDTO of channelDTO.channelUsersDTO) {
      let user = this.getUserById(channelUserDTO.userDTO.id);

      if (!user) {
        user = this.userFromDTO_(channelUserDTO.userDTO);
        this.addUser_(user);
      }
      channelUsers.push(this.channelUserFromDTO_(channelUserDTO, user));
    }
    for (const eventDTO of channelDTO.eventsDTO) {
      events.push(this.eventFromDTO_(eventDTO));
    }
    if (!channel) {
      channel = this.channelFromDTO_(channelDTO);
      const ownerUser = this.getUserById(channel.owner.id);

      if (ownerUser) {
        channel.owner = ownerUser;
      } else {
        this.addUser_(channel.owner);
      }
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

  public privmsg(channelId: string, message: string) {
    socket.emit('privmsg', JSON.stringify([ channelId, message ]));
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
    this.userCurrentChannelBanList_.clear();
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

  public siteBan(userId: string) {
    socket.emit('siteban', JSON.stringify([ userId ]));
  }

  public siteUnban(userId: string) {
    socket.emit('siteunban', JSON.stringify([ userId ]));
  }

  public sitePromote(userId: string) {
    socket.emit('sitepromote', JSON.stringify([ userId ]));
  }

  public siteDemote(userId: string) {
    socket.emit('sitedemote', JSON.stringify([ userId ]));
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

  public challengeSpectate(userId: string) {
    socket.emit('challengespectate', JSON.stringify([ userId ]));
  }

  public list() {
    socket.emit('list');
  }

  public adminWatch() {
    socket.emit('adminwatch');
  }

  public banList(channelUUID: string) {
    socket.emit('channelbanlist', JSON.stringify([ channelUUID ]));
  }

  public adminUnwatch() {
    socket.emit('adminunwatch');
    this.adminChannelList_.value = [];
    this.adminUserList_.value = [];
    this.admin_ = false;
  }

  public userWatch(userId: string, callback?: Function) {
    socket.emit('userwatch', JSON.stringify([ userId ]));
    this.userWatchCallback_ =  callback;
  }

  public userUnwatch(userId: string) {
    socket.emit('userunwatch', JSON.stringify([ userId ]));
  }

  public setUserCurrentChannel = (channelId: string): void => {
    if (this.channels_.has(channelId)) {
      this.userCurrentChannel_.value = this.me_.value.channels.get(channelId) || undefined;
    }
  }

  public setCurrentPrivate = (userId: string): void => {
    if (this.privates_.has(userId)) {
      this.currentPrivate_.value = this.privates_.get(userId);
    } else {
      this.currentPrivate_.value = undefined;
    }
  }

  public setAdminCurrentChannel = (channelId: string): void => {
    const channel = this.adminChannelList_.find(channel => channel.id === channelId);

    if (channel) {
      this.adminCurrentChannel_.value = channel;
    }
  }

  public addChannelUserToChannel_(channel: Channel, channelUser: ChannelUser) {
    channel.addUser(channelUser);
  }

  //Sin uso?
  public delUserFromChannel_(channel: Channel, user: User) {
    channel.delUser(user);
  }

  private addChannel_(channel: Channel) {
    this.channels_.set(channel.id, channel);
    this.updateUserChannelList_()
  }

  private deleteChannel_(channel: Channel) {
    channel.clear();
    this.channels_.delete(channel.id);
    this.updateUserChannelList_()
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
    const user = this.getUserById(userId);

    if (user)
      this.deleteUser_(user);
  }
}

export const client = new ChatClient();
