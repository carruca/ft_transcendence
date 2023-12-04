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
  AdminDataTypeEnum,
  AdminObjectTypeEnum,
} from './enum';

import type {
  UserDTO,
  EventDTO,
  ChannelDTO,
  ChannelUserDTO,
  ChannelSummaryDTO,
} from './dto';

import type {
  UserPayload,
  ChannelPayload,
} from './interface';

import {
  socket,
  socketSend,
} from './ws';

import router from '@/router';

export class ChatClient {
  static instance: ChatClient;

  constructor() {
    if (ChatClient.instance)
      return ChatClient.instance;
    this.setupSocketEventHandlers_();
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

  private isConnected_ = ref<boolean>(false);
  public isConnected = readonly(this.isConnected_);

  private channelsSummary_ = ref<ChannelSummaryDTO[]>([]);
  public channelsSummary = readonly(this.channelsSummary_);

  private userChannelList_ = ref<Channel[]>([]);
  public userChannelList = readonly(this.userChannelList_);

  private userCurrentChannel_ = ref<Channel | undefined>(undefined);
  public userCurrentChannel = readonly(this.userCurrentChannel_);

  private userCurrentChannelBanList_ = reactive(new Map<string, User>);
  public userCurrentChannelBanList = readonly(this.userCurrentChannelBanList_);

  private privateList_ = ref<Private[] | undefined>([]);
  public privateList = readonly(this.privateList_);

  private currentPrivate_ = ref<Private | undefined>(undefined);
  public currentPrivate = readonly(this.currentPrivate_);

  private adminChannelList_ = ref<Channel[]>([]);
  public adminChannelList = readonly(this.adminChannelList_);

  private adminUserList_ = ref<User[]>([]);
  public adminUserList = readonly(this.adminUserList_);

  private adminCurrentChannel_ = ref<Channel | undefined>(undefined);
  public adminCurrentChannel = readonly(this.adminCurrentChannel_);

  private adminCurrentUser_ = ref<User | undefined>(undefined);
  public adminCurrentUser = readonly(this.adminCurrentUser_);

  private showModal_ = ref<boolean>(false);
  public showModal = readonly(this.showModal_);

  private toastMessage_ = ref<string>(undefined);
  public toastMessage = readonly(this.toastMessage_);

  public showToast = ref<boolean>(false);

  private friendPetition_ = ref<Object>(undefined);
  public friendPetition = readonly(this.friendPetition_);

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

  public getChannelById(channelId: string): Channel | undefined {
    return this.channels_.get(channelId);
  }

  public getUserById(userId: string): User | undefined {
    return this.users_.get(userId);
  }

  public getChannelUserById(channelId: string, userId: string): ChannelUser | undefined {
    const channel = this.getChannelById(channelId);
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

  get adminusers() {
    return Array.from(this.adminUsers_);
  }


  private setupSocketEventHandlers_() {
    socket.on('error', this.onError_.bind(this));
    socket.on('reterror', this.onRetError_.bind(this));
    socket.on('retsuccess', this.onRetSuccess_.bind(this));
    socket.on('registered', this.onRegistered_.bind(this));
    socket.on('list', this.onList_.bind(this));
    socket.on('adminData', this.onAdminData_.bind(this));
    socket.on('adminUpdated', this.onAdminUpdated_.bind(this));
    socket.on('watch', this.onWatch_.bind(this));
    socket.on('privMessage', this.onPrivMessage_.bind(this));
    socket.on('unBan', this.onUnban_.bind(this));

    socket.on('challengeRequested', this.onChallengeRequested_.bind(this));
    socket.on('challengeRejected', this.onChallengeRejected_.bind(this));
    socket.on('challengeAccepted', this.onChallengeAccepted_.bind(this));
    socket.on('challengeSpectated', this.onChallengeSpectated_.bind(this));

    socket.on('channelBanList', this.onChannelBanList_.bind(this));
    socket.on('channelCreated', this.onChannelCreated_.bind(this));
    socket.on('channelUpdated', this.onChannelUpdated_.bind(this));
    socket.on('channelDeleted', this.onChannelDeleted_.bind(this));

    socket.on('userCreated', this.onUserCreated_.bind(this));
    socket.on('userUpdated', this.onUserUpdated_.bind(this));
    socket.on('userDeleted', this.onUserDeleted_.bind(this));

    socket.on('userJoined', this.onUserJoined_.bind(this));
    socket.on('userParted', this.onUserParted_.bind(this));

    socket.on('channelEventCreated', this.onChannelEventCreated_.bind(this));
    //socket.on('channelEventUpdated', this.onChannelEventUpdated.bind(this));

    socket.on('userChannelCreated', this.onUserChannelCreated_.bind(this));
    socket.on('userChannelUpdated', this.onUserChannelUpdated_.bind(this));
    socket.on('userChannelDeleted', this.onUserChannelDeleted_.bind(this));

    socket.on('friendship', this.onFriendship_.bind(this));
  }

  private onError_(data: any): void {
    this.isConnected_.value = false;
  }

  private onList_(responseJSON: string): void {
    const channelsDTO = JSON.parse(responseJSON);

    this.channelsSummary_.value = channelsDTO; //.map(item => item.name);
  }

  private onChannelBanList_(responseJSON: string): void {
    const [ channelId, banUsers ] = JSON.parse(responseJSON);
    this.userCurrentChannelBanList_.clear();

    for (const userDTO of banUsers) {
      this.userCurrentChannelBanList_.set(userDTO.id, new User(userDTO));
    }
  }

  private onUnban_(responseJSON: string): void {
    const [ channelId, targetUserId ] = JSON.parse(responseJSON);
    const channel = this.getChannelById(channelId);

    if (!channel) return;
    if (channel.id === this.userCurrentChannel.value.id)
      this.userCurrentChannelBanList_.delete(targetUserId);
  }

  private onAdminData_(responseJSON: string): void {
    const [ channelsDTO, usersDTO ] = JSON.parse(responseJSON);

    this.adminUsers_.clear();
    this.adminChannels_.clear();

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
        const user = this.adminUsers_.get(channelUserDTO.userDTO.id);
        if (!user) throw new Error("Algo fue mal");
        channel.addUser(this.channelUserFromDTO_(channelUserDTO, user));
      }
    }

    this.adminChannelList_.value = Array.from(this.adminChannels_.values());
    this.adminUserList_.value = Array.from(this.adminUsers_.values());

    this.admin_ = true;
  }

  private onAdminUpdated_(responseJSON: string): void {
    const [ object, type, data ] = JSON.parse(responseJSON);

    if (object === AdminObjectTypeEnum.CHANNEL) {
      this.adminChannelUpdate_(type, data);
    } else if (object === AdminObjectTypeEnum.USER) {
      this.adminUserUpdate_(type, data); 
    } else if (object === AdminObjectTypeEnum.CHANNEL_USER) {
      this.adminChannelUserUpdate_(type, data);
    }
  }

  private adminUserUpdate_(type: AdminDataTypeEnum, data: any) {
    let user: User | undefined;

    if (type === AdminDataTypeEnum.CREATED) {
      user = this.userFromDTO_(data);
      if (user)
        this.adminUsers_.set(user.id, user);
      this.adminUserList_.value = Array.from(this.adminUsers_.values());
      if (this.adminCurrentUser_.value == undefined)
        this.adminCurrentUser_.value = this.adminUserList_.value[0];
    } else if (type === AdminDataTypeEnum.UPDATED) {
      user = this.adminUsers_.get(data.id);
      if (user)
        user.update(data);
    } else if (type === AdminDataTypeEnum.DELETED) {
      if (this.adminCurrentUser_.value.id === data) {
        this.adminCurrentUser_.value = this.adminUserList_.value[0]
      }
      this.adminUsers_.delete(data);
      this.adminUserList_.value = Array.from(this.adminUsers_.values());
    }
  }

  private adminChannelUserUpdate_(type: AdminDataTypeEnum, data: any) {
    let channel: Channel | undefined;
    let user: User | undefined;

    if (type === AdminDataTypeEnum.CREATED) {
      channel = this.adminChannels_.get(data.channelId);

      if (channel) {
        user = this.adminUsers_.get(data.userDTO.id);

        if (user) {
          channel.addUser(this.channelUserFromDTO_(data, user));
        }
      }
    } else if (type === AdminDataTypeEnum.UPDATED) {

    } else if (type === AdminDataTypeEnum.DELETED) {
      channel = this.adminChannels_.get(data.channelId);

      if (channel) {
        user = this.adminUsers_.get(data.sourceUserId);
        channel.delUser(user);
      }
    }
  }

  private adminChannelUpdate_(type: AdminDataTypeEnum, data: any) {
    let channel: Channel | undefined;

    if (type === AdminDataTypeEnum.CREATED ) {
      channel = this.adminChannels_.get(data.id);

      if (!channel) {
        channel = this.channelFromDTO_(data);
        const ownerUser = this.adminUsers_.get(channel.owner.id);

        if (ownerUser) {
          channel.owner = ownerUser;
        }
        this.adminChannels_.set(channel.id, channel);
        for (const channelUserDTO of data.channelUsersDTO) {
          const user = this.adminUsers_.get(channelUserDTO.userDTO.id);
          if (!user) throw new Error("Algo fue mal");
          channel.addUser(this.channelUserFromDTO_(channelUserDTO, user));
        }
      }
      this.adminChannelList_.value = Array.from(this.adminChannels_.values());
      if (this.adminCurrentChannel_.value == undefined)
        this.adminCurrentChannel_.value = this.adminChannelList_.value[0];
    } else if (type === AdminDataTypeEnum.UPDATED) {
      channel = this.adminChannels_.get(data.id);
      if (channel)
        channel.update(data);
    } else if (type === AdminDataTypeEnum.DELETED) {
      if (this.adminCurrentChannel_.value.id === data) {
        this.adminCurrentChannel_.value = this.adminChannelList_.value[0]
      }
      this.adminChannels_.delete(data);
      this.adminChannelList_.value = Array.from(this.adminChannels_.values());
    }
  }

  private onChallengeSpectated_(responseJSON: string): void {
    const { sourceUserId, gameMode } = JSON.parse(responseJSON);
    const sourceUser = this.getUserById(sourceUserId);

    router.push('/game');
  }

  private onChallengeAccepted_(responseJSON: string): void {
    const { sourceUserId, gameMode } = JSON.parse(responseJSON);
    const sourceUser = this.getUserById(sourceUserId);

    router.push('/game');
  }

  private onChallengeRejected_(responseJSON: string): void {
    const { sourceUserId, gameMode } = JSON.parse(responseJSON);
    const sourceUser = this.getUserById(sourceUserId);

    this.showModal_.value = false;
  }

  private onChallengeRequested_(responseJSON: string): void {
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
  }

  private onWatch_(responseJSON: string): void {
    const [ targetUser ] = JSON.parse(responseJSON);

    this.addUserFromDTO_(targetUser);
  }

  private onPrivMessage_(responseJSON: string): void {
    const [ eventDTO ] = JSON.parse(responseJSON);
    const event = this.eventFromDTO_(eventDTO);

    this.addPrivateEvent_(event);
  }

  private onUserJoined_(responseJSON: string): void {
    const { channelId, sourceChannelUserDTO } = JSON.parse(responseJSON);
    const channel = this.getChannelById(channelId);
    let user = this.getUserById(sourceChannelUserDTO.userDTO.id);
    if (!channel)
      throw new Error(`Channel ${channelId} not found`);
    if (!user) {
      user = this.userFromDTO_(sourceChannelUserDTO.userDTO);
      this.addUser_(user);
    } else {
      user.update(sourceChannelUserDTO.userDTO);
    }
    const sourceChannelUser = this.channelUserFromDTO_(sourceChannelUserDTO, user);

    this.addChannelUserToChannel_(channel, sourceChannelUser);
  }

  private onUserParted_(responseJSON: string): void {
    const { channelId, sourceUserId } = JSON.parse(responseJSON);
    const channel = this.getChannelById(channelId);
    const sourceUser = this.getUserById(sourceUserId);

    if (!channel)
      throw new Error(`Channel ${channelId} not found`);
    if (!sourceUser)
      throw new Error(`User ${sourceUserId} not found`);
    this.delUserFromChannel_(channel, sourceUser);
  }

  private onRetError_(responseJSON: string): void {
    const response = JSON.parse(responseJSON);
    this.toastMessage_.value = response.message;
    this.showToast.value = true;
  }

  private onRetSuccess_(responseJSON: string): void {
    const response = JSON.parse(responseJSON);

  }

  private onRegistered_(responseJSON: string): void {
    const meUserDTO = JSON.parse(responseJSON);

    this.users_.clear();
    this.channels_.clear();
    this.me_.value = this.addUserFromDTO_(meUserDTO);

    this.updateUserChannelList_();
    this.userCurrentChannel_.value = this.userChannelList.value[0];
    this.isConnected_.value = true;
  }

  private updateUserChannelList_(): void {
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

  private onChannelCreated_(dataJSON: string) {
    const channelDTO = JSON.parse(dataJSON);

    this.addChannelFromDTO_(channelDTO)
    this.updateUserChannelList_();
  }

  private onChannelUpdated_(dataJSON: string) {
    const { channelId, userId, ...changes} = JSON.parse(dataJSON);
    const channel = this.getChannelById(channelId);
    const user = this.getUserById(userId);
    const channelUser = this.getChannelUserById(channelId, userId);

    if (!channel)
      throw new Error(`Channel ${channelId} not found`);

    channel.update(channelUser, changes);
  }

  private onChannelDeleted_(dataJSON: string) {
    const channelId = JSON.parse(dataJSON);
    const channel = this.getChannelById(channelId);

	if (!channel)
	  throw new Error(`Channel ${channelId} not found`);

    this.deleteChannel_(channel);
    this.updateUserChannelList_();
    this.manageDestroyedChannelSelection_(channel);
  }

  private onUserCreated_(dataJSON: string) {
    const data = JSON.parse(dataJSON);

  }

  private onUserUpdated_(dataJSON: string) {
    const { sourceUserId, changes } = JSON.parse(dataJSON);
    let sourceUser = this.getUserById(sourceUserId);

    if (sourceUser) {
      sourceUser.update(changes);
    }
  }

  private userUpdate_(userId: string, chanes: UserDTO) {
    let user;

    if (this.admin_)
      user = this.adminUserList
  }

  private onUserDeleted_(dataJSON: string) {
    const data = JSON.parse(dataJSON);

  }

  private onEventCreated_(dataJSON: string) {
    const data = JSON.parse(dataJSON);

  }

  private onEventUpdated_(dataJSON: string) {
    const data = JSON.parse(dataJSON);

  }

  private onUserChannelCreated_(dataJSON: string) {
    const data = JSON.parse(dataJSON);

  }

  private onUserChannelUpdated_(dataJSON: string) {
    const data = JSON.parse(dataJSON);

  }

  private onUserChannelDeleted_(dataJSON: string) {
    const data = JSON.parse(dataJSON);

  }

  private onFriendship_(dataJSON: string) {
    const data = JSON.parse(dataJSON);

    this.friendPetition_.value = data;
  }

  private onChannelEventCreated_(dataJSON: string) {
    const { channelId, eventDTO } = JSON.parse(dataJSON);

    const event = this.eventFromDTO_(eventDTO)
    const channel = this.getChannelById(channelId);

    if (channel)
      channel.addEvent(event);
  }

  private addUserFromDTO_(userDTO: UserDTO): User {
    let user = this.getUserById(userDTO.id);
    let channel: Channel;
    let channelUser: ChannelUser[];

    if (!user) {
      user = this.userFromDTO_(userDTO);
      this.addUser_(user);
    }

    if (userDTO.channelsDTO) {
      for (const channelDTO of userDTO.channelsDTO) {
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
      siteBanned: userDTO.siteBanned,
      siteDisabled: userDTO.siteDisabled,
    });
  }

  private channelUserFromDTO_(channelUserDTO: ChannelUserDTO, user: User): ChannelUser {
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

    if (event.source.id == this.me_.value.id) {
      remoteId = event.target.id;
      remoteNickname = event.target.name;
    } else {
      remoteId = event.source.id;
      remoteNickname = event.source.name;
    }
    const priv = this.receivePrivate_(remoteId, remoteNickname);

    priv.addEvent(event);
	  return priv;
  }

  public openPrivate(userId: string, nickUsername: string): Private {
    const priv = this.receivePrivate_(userId, nickUsername);

    this.currentPrivate_.value = priv;
    return priv;
  }

  private receivePrivate_(userId: string, userNickname: string): Private {
    let priv = this.privates_.get(userId);

    if (!priv) {
      priv = new Private(userId, userNickname);
      this.privates_.set(userId, priv);
    }

    this.privateList_.value = Array.from(this.privates_.values());
    return priv;
  }

  public closePrivate(userId) {
    this.privates_.delete(userId);
    this.privateList_.value = Array.from(this.privates_.values());
    if (this.currentPrivate.value === undefined) return;
    if (this.currentPrivate_.value.id == userId) {
      this.currentPrivate_.value = this.privates_.values().next().value;
    }
  }

  private addChannelFromDTO_(channelDTO: ChannelDTO): Channel {
    const channelUsers: ChannelUser[] = [];
    const events: Event[] = [];
    let channel = this.getChannelById(channelDTO.id);

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
    socketSend('chanmsg', JSON.stringify([ channelId, message ]));
  }

  public privmsg(channelId: string, message: string) {
    socketSend('privmsg', JSON.stringify([ channelId, message ]));
  }

  public create(channelName: string, password?: string) {
    socketSend('create', JSON.stringify([ channelName, password === "" ? undefined : password ]));
  }

  public join(channelId: string, password?: string) {
    socketSend('join', JSON.stringify([ channelId, password ]));
  }

  public part(channelId: string) {
    socketSend('part', JSON.stringify([ channelId ]));
  }

  public close(channelId: string) {
    socketSend('close', JSON.stringify([ channelId ]));
  }

  public kick(channelId: string, userId: string, message?: string) {
    socketSend('kick', JSON.stringify([ channelId, userId, message ]));
  }

  public ban(channelId: string, userId: string) {
    socketSend('ban', JSON.stringify([ channelId, userId ]));
  }

  public unban(channelId: string, userId: string) {
    socketSend('unban', JSON.stringify([ channelId, userId ]));
  }

  public promote(channelId: string, userId: string) {
    socketSend('promote', JSON.stringify([ channelId, userId ]));
  }

  public demote(channelId: string, userId: string) {
    socketSend('demote', JSON.stringify([ channelId, userId ]));
  }

  public siteBan(userId: string) {
    socketSend('siteban', JSON.stringify([ userId ]));
  }

  public siteUnban(userId: string) {
    socketSend('siteunban', JSON.stringify([ userId ]));
  }

  public sitePromote(userId: string) {
    socketSend('sitepromote', JSON.stringify([ userId ]));
  }

  public siteDemote(userId: string) {
    socketSend('sitedemote', JSON.stringify([ userId ]));
  }

  public password(channelId: string, password?: string) {
    socketSend('password', JSON.stringify([ channelId, password ]));
  }

  public mute(channelId: string, userId: string) {
    socketSend('mute', JSON.stringify([ channelId, userId ]));
  }

  public unmute(channelId: string, userId: string) {
    socketSend('unmute', JSON.stringify([ channelId, userId ]));
  }

  public topic(channelId: string, topic: string) {
    socketSend('topic', JSON.stringify([ channelId, topic ]));
  }

  public block(userId: string) {
    socketSend('block', JSON.stringify([ userId ]));
  }

  public unblock(userId: string) {
    socketSend('unblock', JSON.stringify([ userId ]));
  }

  public challengeRequest(userId: string, gameMode?: GameMode) {
    socketSend('challengerequest', JSON.stringify([ userId, gameMode ]));
  }

  public challengeAccept(userId: string, gameMode?: GameMode) {
    socketSend('challengeaccept', JSON.stringify([ userId, gameMode ]));
  }

  public challengeReject(userId: string) {
    socketSend('challengereject', JSON.stringify([ userId ]));
  }

  public challengeSpectate(userId: string) {
    socketSend('challengespectate', JSON.stringify([ userId ]));
  }

  public list() {
    socketSend('list');
  }

  public adminWatch() {
    socketSend('adminwatch');
  }

  public banList(channelUUID: string) {
    socketSend('channelbanlist', JSON.stringify([ channelUUID ]));
  }

  public adminUnwatch() {
    socketSend('adminunwatch');
    this.adminChannelList_.value = [];
    this.adminUserList_.value = [];
    this.admin_ = false;
  }

  public userWatch(userId: string[]) {
    socketSend('userwatch', JSON.stringify(userId));
  }

  public userUnwatch(userId: string[]) {
    socketSend('userunwatch', JSON.stringify(userId));
  }

  public setUserCurrentChannel = (channelId: string | undefined): void => {
    if (channelId === undefined)
      this.userCurrentChannel_.value = undefined;
    else 
      this.userCurrentChannel_.value = this.me_.value.channels.get(channelId);
  }

  public setCurrentPrivate = (userId: string | undefined): void => {
    if (userId === undefined)
      this.currentPrivate_.value = undefined;
    else
      this.currentPrivate_.value = this.privates_.get(userId);
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
    const channel = this.getChannelById(channelId);

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

export const client = ChatClient.getInstance();
