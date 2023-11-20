import type { UserStatus } from './user-status';
import type { UserDetails } from './user-details';
import type { Channel } from './channel';
import { UserChannelRole, UserSiteRole } from './user-details';

export { UserChannelRole, UserSiteRole, UserDetails };

export class User {
  private uuid_?: string;
  private name_?: string;
  private status_?: UserStatus;
  private siteRole_?: UserSiteRole;
  private channels_: Map<string, Channel>;
  private mutes_: Set<string>;

  constructor(data: UserDetails) {
    this.uuid_ = data.uuid;
    this.name_ = data.name;
    this.status_ = data.status;
    this.siteRole_ = data.siteRole;
    this.channels_ = new Map<string, Channel>();
    this.mutes_ = new Set<string>();
  }

  get uuid(): string {
    return this.uuid_!;
  }

  get name(): string {
    return this.name_!;
  }

  set name(value: string) {
    this.name_ = value;
  }

  get status(): UserStatus {
    return this.status_!;
  }

  set status(value: UserStatus) {
    this.status_ = value;
  }

  get siteRole(): UserSiteRole {
    return this.siteRole_!;
  }

  set siteRole(value: UserSiteRole) {
    this.siteRole_ = value;
  }

  get hasNoChannels(): boolean {
    return this.getChannelsCount() == 0;
  }

  getChannelsCount(): number {
    return this.channels_.size;
  }

  getChannelsArray(): Channel[] {
    return Array.from(this.channels_.values());
  }

  getDetails(): UserDetails {
    return {
      uuid: this.uuid_,
      name: this.name_,
      status: this.status_,
      siteRole: this.siteRole_,
    };
  }

  public addChannel(channel: Channel) {
    this.channels_.set(channel.uuid, channel);
  }

  public removeChannel(channel: Channel) {
    this.channels_.delete(channel.uuid);
  }

  public hasChannel(channel: Channel) {
    return this.channels_.has(channel.uuid);
  }

  public addMute(user: User) {
    this.mutes_.add(user.uuid);
  }

  public removeMute(user: User) {
    this.mutes_.delete(user.uuid);
  }

  public hasMuted(user: User) {
    return this.mutes_.has(user.uuid);
  }
}
