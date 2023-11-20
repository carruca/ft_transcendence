import type { ChannelDetails, ChannelTopic } from './channeldetails';
import type { User } from './user';

export { ChannelDetails, ChannelTopic };

export class Channel {
  private uuid_: string;
  private name_: string;
  private owner_: User;
  private topic_?: ChannelTopic;
  private hasPassword_: boolean;
  private users_: Map<string, User>;
  private bans_: Map<string, User>;
  private opers_: Set<string>;
  private mutes_: Set<string>;

  constructor(data: ChannelDetails) {
    this.uuid_ = data.uuid;
	this.name_ = data.name;
    //this.owner_ = data.owner;
	this.topic_ = data.topic;
	this.hasPassword_ = data.hasPassword;
    this.users_ = new Map<string, User>();
    this.bans_ = new Map<string, User>();
    this.opers_ = new Set<string>();
    this.mutes_ = new Set<string>();
  }

  get uuid(): string {
    return this.uuid_;
  }

  get name(): string {
    return this.name_;
  }

  get owner(): User {
    return this.owner_;
  }

  set owner(value: User) {
    this.owner_ = value;
  }

  set hasPassword(value: boolean) {
	this.hasPassword_ = value;
  }

  get hasPassword(): boolean {
	return this.hasPassword_;
  }

  get topic(): ChannelTopic | undefined {
    return this.topic_;
  }

  set topic(value: ChannelTopic | undefined) {
    this.topic_ = value;
  }

  get hasNoUsers(): boolean {
    return this.getUsersCount() === 0;
  }

  getUsersCount(): number {
    return this.users_.size;
  }

  getUsersArray(): User[] {
    return Array.from(this.users_.values());
  }

  addUser(user: User): void {
    this.users_.set(user.uuid, user);
  }

  removeUser(user: User): void {
    this.users_.delete(user.uuid);
    this.opers_.delete(user.uuid);
  }

  hasUser(user: User): boolean {
    return this.users_.has(user.uuid);
  }

  addOper(user: User): void {
    this.opers_.add(user.uuid);
  }

  removeOper(user: User): void {
    this.users_.delete(user.uuid);
  }

  hasOper(user: User): boolean {
    return this.users_.has(user.uuid);
  }

  addMute(user: User): void {
    this.mutes_.add(user.uuid);
  }

  hasMute(user: User): boolean {
    return this.mutes_.has(user.uuid);
  }

  removeMute(user: User): void {
    this.users_.delete(user.uuid);
  }

  addBan(user: User): void {
    this.bans_.set(user.uuid, user);
  }

  hasBan(user: User): boolean {
    return this.bans_.has(user.uuid);
  }

  removeBan(user: User): void {
    this.bans_.delete(user.uuid);
  }
}

