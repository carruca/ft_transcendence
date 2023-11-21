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
  v4 as uuidv4,
} from 'uuid';

import socket from './ws';

import './client';

class ChatClient {
  private channels_: Map<string, Channel> = new Map();
  private users_: Map<string, User> = new Map();

  private channelList_ = ref<Channel[]>([]);
  public channelList = readonly(this.channelList_);

  private currentChannel_ = ref<Channel | null>(null);
  public currentChannel = readonly(this.currentChannel_);

  constructor() {
    this.setupSocketEventHandlers_();
  }

  private setupSocketEventHandlers_() {
    socket.on('reterr', this.onRetErr.bind(this));
    socket.on('register', this.onRegister.bind(this));
    socket.on('create', this.onCreate.bind(this));
    socket.on('join', this.onJoin.bind(this));
    socket.on('part', this.onPart.bind(this));
    socket.on('update', this.onUpdate.bind(this));

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
    socket.on('type', this.onType.bind(this));
    socket.on('chanmsg', this.onChanmsg.bind(this));
    socket.on('convmsg', this.onConvmsg.bind(this));
    socket.on('convopen', this.onConvopen.bind(this));
    */
  }

  private onRetErr(responseJSON: string): void {
    const response = JSON.parse(responseJSON);

    console.log(`%cError: ${response.message}`, "color: red;");
  }

  private onRegister(responseJSON: string): void {
    const response = JSON.parse(responseJSON);

    console.log(`%cSuccess: Your uuid is '${response.uuid}' and '${response.name}' is your nick`, "color: green;");
    //this.me_ = User(data)
  }

  private onCreate(dataJSON: string): void {
    const data = JSON.parse(dataJSON);

    console.log(data);
  }

  private onJoin(dataJSON: string): void {
    const data = JSON.parse(dataJSON);

  }

  private onPart(dataJSON: string): void {
    const data = JSON.parse(dataJSON);

  }

  private onUpdate(dataJSON: string): void {
    const data = JSON.parse(dataJSON);
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
    const ownerUser = this.createUser("owner", { siteRole: UserSiteRoleEnum.OWNER, isBanned: false, isDisabled: false });
    const user1 = this.createUser("User1", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user2 = this.createUser("User2", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
    const user3 = this.createUser("User3", { siteRole: UserSiteRoleEnum.NONE, isBanned: false, isDisabled: false });
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
    const channel1 = this.createChannel("#paco", user1);
    const channel2 = this.createChannel("#jones", user2);
    let channel3: Channel;

    setTimeout(() => {
      channel3 = this.createChannel("#vermikins", ownerUser);
      this.join(channel1, user2);
      this.join(channel1, user3);
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
  }

  private delChannel_(channel: Channel) {
    channel.clear();
    this.channels_.delete(channel.uuid);
  }

  public createUser(userName: string, siteRole: UserSiteRoleEnum, isFriend: boolean): User {
    const user = new User(uuidv4(), userName, siteRole, isFriend);
    return user;
  }

  public createChannel(channelName: string, ownerUser: User, password?: string): Channel {
    const channel = new Channel(uuidv4(), channelName, ownerUser, password);

    channel.addEvent(new Event(
      uuidv4(),
      EventTypeEnum.CREATE,
      ownerUser,
    ));
        
    this.addChannel_(channel);
    this.addUserToChannel(channel, ownerUser, { isAdmin: true, isBanned: false, isMute: false });
    this.channelList_.value = Array.from(this.channels_.values());
    return channel;
  }

  public closeChannel(channel: Channel, sourceUser: User) {
    channel.addEvent(new Event(
      uuidv4(),
      EventTypeEnum.CLOSE,
      sourceUser,
    ));
    this.delChannel_(channel);
    this.channelList_.value = Array.from(this.channels_.values());
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
      this.currentChannel_.value = this.channels_.get(channelUUID) || undefined;
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

