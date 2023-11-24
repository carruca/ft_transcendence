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

  private getChannelByUUID_(channelUUID: string): Channel {
    return this.channels_.get(channelUUID); 
  }

  private getUserByUUID_(userUUID: string): User {
    return this.users_.get(userUUID);
  }

  get me() {
    console.log(this.channels_);
    return this.me_;
  }

  get channels() {
    return this.channels_.values();
  }

  get users() {
    return Array.from(this.users_.values());
  }
  private setupSocketEventHandlers_() {
    socket.on('reterr', this.onRetErr.bind(this));
    socket.on('registered', this.onRegistered.bind(this));

    socket.on('channelCreated', this.onChannelCreated.bind(this));
    socket.on('channelUpdated', this.onChannelUpdated.bind(this));
    socket.on('channelDeleted', this.onChannelDeleted.bind(this));

    socket.on('userCreated', this.onUserCreated.bind(this));
    socket.on('userUpdated', this.onUserUpdated.bind(this));
    socket.on('userDeleted', this.onUserDeleted.bind(this));

    socket.on('eventCreated', this.onEventCreated.bind(this));
    socket.on('eventUpdated', this.onEventUpdated.bind(this));

    socket.on('userChannelCreated', this.onUserChannelCreated.bind(this));
    socket.on('userChannelUpdated', this.onUserChannelUpdated.bind(this));
    socket.on('userChannelDeleted', this.onUserChannelDeleted.bind(this));
  }


  private onRetErr(responseJSON: string): void {
    const response = JSON.parse(responseJSON);

    console.log(`%cError: ${response.message}`, "color: red;");
  }

  private onRegistered(responseJSON: string): void {
    const meUserDTO = JSON.parse(responseJSON);

    //TODO: Aquí lo que llega es la información de nuestro usuario, eso contempla
    //todos los canales y de estos, los usuarios y los eventos.
    this.me_ = this.addUserFromDTO_(meUserDTO);
    //meUserDTO.channels.map((channelDTO: ChannelDTO) => this.me_.channels.set(channelDTO.uuid, this.addChannel_(this.channelFromDTO_(channelDTO))));


    console.log(`%cSuccess: Your uuid is '${this.me_.uuid}' and '${this.me_.name}' is your nick. You are in ${this.me_.channels.size} channels`, "color: green;");
    //console.log(meUserDTO);
    this.channelList_.value = Array.from(this.me_.channels.values());
    this.currentChannel_.value = this.channelList.value[0]; //this.me_.channels.values().next().value;
  }

  private onChannelCreated(dataJSON: string) {
    const data = JSON.parse(dataJSON);

    console.log('onChannelCreated', data);
  }

  private onChannelUpdated(dataJSON: string) {
    const data = JSON.parse(dataJSON);

    console.log('onChannelUpdated', data);
  }

  private onChannelDeleted(dataJSON: string) {
    const data = JSON.parse(dataJSON);

    console.log('onChannelDeleted', data);
  }

  private onUserCreated(dataJSON: string) {
    const data = JSON.parse(dataJSON);

    console.log('onChannelCreated', data);
  }

  private onUserUpdated(dataJSON: string) {
    const data = JSON.parse(dataJSON);

    console.log('onUserUpdated', data);
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

  private addUserFromDTO_(userDTO: UserDTO): User {
    let user = this.getUserByUUID_(userDTO.uuid);
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
    let ownerUser = this.getUserByUUID_(channelDTO.ownerUserDTO.uuid);

    if (!ownerUser) {
      user = this.userFromDTO_(channelDTO.ownerUserDTO);
      this.addUser_(user);
    }

    return new Channel({
      uuid: channelDTO.uuid,
      name: channelDTO.name,
      ownerUser: ownerUser,
      creationDate: channelDTO.creationDate,
      hasPassword: channelDTO.hasPassword,
    });
  }

  private userFromDTO_(userDTO: UserDTO): User {
    return new User({
      uuid: userDTO.uuid,
      name: userDTO.name,
      siteRole: userDTO.siteRole,
      status: userDTO.status,
      blocked: userDTO.blocked,
      friend: userDTO.friend,
    });
  }

  private channelUserFromDTO_(channelUserDTO: ChannelUserDTO): ChannelUser {
    let user = this.getUserByUUID_(channelUserDTO.uuid);
    
    if (!user) {
      user = this.userFromDTO_(channelUserDTO);
      this.addUser_(user);
    }

    return new ChannelUser({
      user: user,
      admin: channelUserDTO.admin,
      owner: channelUserDTO.owner,
      muted: channelUserDTO.muted,
      banned: channelUserDTO.manned,
    });
  }

  private eventFromDTO_(eventDTO: EventDTO): Event {
    let sourceUser = this.getUserByUUID_(eventDTO.sourceUUID);
    let targetUser = this.getUserByUUID_(eventDTO.targetUUID);

    return new Event({
      uuid: eventDTO.uuid,
      type: eventDTO.type,
      timestamp: eventDTO.timestamp,
      modified: eventDTO.modified,
      sourceUser: sourceUser,
      targetUser: targetUser,
      value: eventDTO.value,
    }); 
  }

  private addChannelFromDTO_(channelDTO: ChannelDTO): Channel {
    const channelUsers: ChannelUser[] = [];
    const events: Event[] = [];
    let channel = this.getChannelByUUID_(channelDTO);

    for (const channelUserDTO of channelDTO.users) {
      channelUsers.push(this.channelUserFromDTO_(channelUserDTO));
    }
    for (const eventDTO of channelDTO.events) {
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

  private clear_() {
    for (const channel of this.channels_.values()) {
      channel.clear();
    }
    this.channels_.clear();
    this.users_.clear();
  }

  public playSim() {
    this.clear_();
    const ownerUser = this.createUser({ name: "owner" });
    const user1 = this.createUser({ name: "User1" });
    const user2 = this.createUser({ name: "User2" });
    const user3 = this.createUser({ name: "User3" });
    const channel1 = this.createChannel("#test", user1);
    const channel2 = this.createChannel("#wer", user2);
    this.join(channel1, user3);
    let channel3: Channel;

    setTimeout(() => {
      channel3 = this.createChannel("#new_chan", ownerUser);
      this.join(channel1, user2);
      this.chanmsg(channel1, user2, "Hola tio");
    }, 1000);
    setTimeout(() => {
      this.chanmsg(channel1, user1, "Fuera de aquí!");
    }, 2000);
    setTimeout(() => {
      this.ban(channel1, user1, user2);
    }, 3000);
    setTimeout(() => {
      this.chanmsg(channel1, user1, "Payaso...");
      this.part(channel1, user3);
      this.closeChannel(channel3);
    }, 4000);

    this.currentChannel_.value = this.channels_.values().next().value;
  }

  public playAdminSim() {
    this.clear_();
    const ownerUser = this.createUser("owner", { siteRole: UserSiteRoleEnum.OWNER, isBanned: false, isDisabled: false });
    const user1 = this.createUser("User1", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user2 = this.createUser("User2", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user3 = this.createUser("User3", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user4 = this.createUser("User4", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user5 = this.createUser("User5", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user6 = this.createUser("User6", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user7 = this.createUser("User7", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user8 = this.createUser("User8", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user9 = this.createUser("User9", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user10 = this.createUser("User10", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user11 = this.createUser("User11", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user12 = this.createUser("User12", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user13 = this.createUser("User13", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user14 = this.createUser("User14", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user15 = this.createUser("User15", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user16 = this.createUser("User16", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user17 = this.createUser("User17", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user18 = this.createUser("User18", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user19 = this.createUser("User19", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user20 = this.createUser("User20", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user21 = this.createUser("User21", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user22 = this.createUser("User22", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user23 = this.createUser("User23", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user24 = this.createUser("User24", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user25 = this.createUser("User25", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const channel1 = this.createChannel("#paco", user1);
    const channel2 = this.createChannel("#jones", user2, "patata");
    let channel3: Channel;

    setTimeout(() => {
      channel3 = this.createChannel("#vermikins", ownerUser);
      this.join(channel1, user2);
      this.join(channel1, user3);
      this.join(channel1, user4);
      this.join(channel1, user5);
      this.join(channel1, user6);
      this.join(channel1, user7);
      this.join(channel1, user8);
      this.join(channel1, user9);
      this.join(channel1, user10);
      this.join(channel1, user11);
      this.join(channel1, user12);
      this.join(channel1, user13);
      this.join(channel1, user14);
      this.join(channel1, user15);
      this.join(channel1, user16);
      this.join(channel1, user17);
      this.join(channel1, user18);
      this.join(channel1, user19);
      this.join(channel1, user20);
      this.join(channel1, user21);
      this.join(channel1, user22);
      this.join(channel1, user23);
      this.join(channel1, user24);
      this.join(channel1, user25);
      this.chanmsg(channel1, user2, "Donde caemos gente?");
    }, 1000);
    setTimeout(() => {
      this.chanmsg(channel1, user1, "En el ban por tonto!");
    }, 2000);
    setTimeout(() => {
      this.chanmsg(channel1, user1, "Y tu pa fuera!");
      this.ban(channel1, user1, user2);
    }, 3000);
    setTimeout(() => {
      this.kick(channel1, user1, user3);
    }, 5000);
    setTimeout(() => {
      this.chanmsg(channel1, user1, "Noobs...");
      this.closeChannel(channel3);
    }, 7000);

    this.currentChannel_.value = this.channels_.values().next().value;
  }

  private addChannel_(channel: Channel) {
    this.channels_.set(channel.uuid, channel);
    this.channelList_.value = Array.from(this.channels_.values());
  }

  private delChannel_(channel: Channel) {
    channel.clear();
    this.channels_.delete(channel.uuid);
    this.channelList_.value = Array.from(this.channels_.values());
  }

  private addUser_(user: User): User {
    this.users_.set(user.uuid, user);
    return user;
  }

  private delUser_(user: User) {
    this.users_.delete(user.uuid);
  }
  public createUser(userPayload: UserPayload): User {
    userPayload.uuid = userPayload.uuid ?? uuidv4();
    const user = new User(userPayload);

    this.addUser_(user);
    return user;
  }

  public deleteUser(user: User) {
    this.delUser_(user);
  }

  public createChannel(name: string, ownerUser: User, hasPassword?: boolean): Channel {
    const channel = new Channel({
      uuid: uuidv4(),
      name: name,
      ownerUser: ownerUser,
      hasPassword: hasPassword
    });

    channel.addEvent(new Event(
      uuidv4(),
      EventTypeEnum.CREATE,
      ownerUser,
    ));
        
    this.addChannel_(channel);
    this.addUserToChannel(channel, ownerUser, { isAdmin: true, isBanned: false, isMute: false });
    this.channelList_.value = Array.from(this.me_.channels_.values());
    return channel;
  }

  public closeChannel(channel: Channel, sourceUser: User) {
    channel.addEvent(new Event(
      uuidv4(),
      EventTypeEnum.CLOSE,
      sourceUser,
    ));
    this.delChannel_(channel);
    this.channelList_.value = Array.from(this.me_.channels_.values());
  }

  public ban(channel: Channel, sourceUser: User, targetUser: User) {
    channel.addEvent(new Event(
      uuidv4(),
      EventTypeEnum.BAN,
      sourceUser,
      targetUser,
    ));
    channel.user(targetUser).isBanned = true;
  }

  public unban(channel: Channel, sourceUser: User, targetUser: User) {
    channel.addEvent(new Event(
      uuidv4(),
      EventTypeEnum.UNBAN,
      sourceUser,
      targetUser,
    ));
    channel.user(targetUser).isBanned = false;
  }

  public mute(channel: Channel, sourceUser: User, targetUser: User) {
    channel.addEvent(new Event(
      uuidv4(),
      EventTypeEnum.MUTE,
      sourceUser,
      targetUser,
    ));
    channel.user(targetUser).isMuted = true;
  }

  public unmute(channel: Channel, sourceUser: User, targetUser: User) {
    channel.addEvent(new Event(
    uuidv4(),
    EventTypeEnum.UNMUTE,
    sourceUser,
    targetUser,
  ));
  channel.user(targetUser).isMuted = false;
  }

  public promote(channel: Channel, sourceUser: User, targetUser: User) {
    channel.addEvent(new Event(
      uuidv4(),
      EventTypeEnum.PROMOTE,
      sourceUser,
      targetUser,
    ));
    channel.user(targetUser).isAdmin = true;
  }

  public demote(channel: Channel, sourceUser: User, targetUser: User) {
    channel.addEvent(new Event(
      uuidv4(),
      EventTypeEnum.DEMOTE,
      sourceUser,
      targetUser,
    ));
    channel.user(targetUser).isAdmin = false;
  }

  public kick(channel: Channel, sourceUser: User, targetUser: User) {
    channel.addEvent(new Event(
      uuidv4(),
      EventTypeEnum.KICK,
      sourceUser,
      targetUser,
    ));
    this.delUserFromChannel(channel, targetUser);
  }

  public join(channel: Channel, sourceUser: User) {
    channel.addEvent(new Event(
      uuidv4(),
      EventTypeEnum.JOIN,
      sourceUser,
    )); 
    this.addUserToChannel(channel, sourceUser, { isAdmin: false, isBanned: false, isMute: false });
  }

  public part(channel: Channel, sourceUser: User) {
    channel.addEvent(new Event(
      uuidv4(),
      EventTypeEnum.PART,
      sourceUser,
    ));
    this.delUserFromChannel(channel, sourceUser);
  }

  public chanmsg(channel: Channel, sourceUser: User, message: string) {
    channel.addEvent(new Event(
      uuidv4(),
      EventTypeEnum.MESSAGE,
      sourceUser,
      undefined,
      message,
    ));
  }

  public privmsg(targetUser: User, sourceUser: User, message: string) {
    targetUser.addEvent(new Event(
      uuidv4(),
      EventTypeEnum.MESSAGE,
      sourceUser,
      targetUser,
      message,
    ));
  }

  public setCurrentChannel = (channelUUID: string): void => {
    if (this.channels_.has(channelUUID)) {
      this.currentChannel_.value = this.me_.channels.get(channelUUID) || undefined;
    }
  }

  public addUserToChannel(channel: Channel, user: User, props: ChannelUserProperties): ChannelUser {
    const newChannelUser = new ChannelUser(user, props);
    channel.addUser(newChannelUser);
    return newChannelUser;
  }

  public delUserFromChannel(channel: Channel, user: User) {
    channel.users.delete(user.uuid);
  }
}

export const client = new ChatClient();

