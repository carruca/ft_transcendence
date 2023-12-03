import {
  EvenTypeEnum,
  UserSiteRoleEnum,
  UserStatusEnum,
} from '../enum';

import {
  UserDTO,
  ChannelDTO,
} from '../dto';

import {
  Channel,
} from '.';

export class User {
  public readonly id: string;
  //public name: string;
  public siteRole_: UserSiteRoleEnum;
  public status: UserStatusEnum;
  public friend: boolean;
  public blocked: boolean;
  public siteBanned: boolean;
  public siteDisabled: boolean;
  public nickname: string;
  public readonly channels = new Map<string, Channel>();

  constructor(userDTO: UserDTO) {
    this.id = userDTO.id;
    this.nickname = userDTO.nickname;
    this.siteRole_ = userDTO.siteRole ?? UserSiteRoleEnum.NONE;
    this.status = userDTO.status ?? UserStatusEnum.OFFLINE;
    this.friend = userDTO.friend ?? false;
    this.blocked = userDTO.blocked ?? false;
    this.siteBanned = userDTO.siteBanned;
    this.siteDisabled = userDTO.siteDisabled;
  }

  addChannel(channel: Channel) {
    this.channels.set(channel.id, channel);
  }

  delChannel(channel: Cannel) {
    this.channels.delete(channel.id);
  }

  get name(): string {
    return this.nickname;
  }

  get siteRole(): UserSiteRoleEnum {
    return this.siteRole_;
  }

  set siteRole(value: UserSiteRoleEnum) {
    this.siteRole_ = value;
  }

  get isSiteModerator(): boolean {
    return (this.siteRole_ === UserSiteRoleEnum.MODERATOR);
  }

  get isSiteOwner(): boolean {
    return (this.siteRole_ === UserSiteRoleEnum.OWNER);
  }

  update(changes: UserDTO) {
    if (changes.status !== undefined)
      this.status = changes.status;
    if (changes.nickname !== undefined)
      this.nickname = changes.nickname;
    if (changes.siteRole !== undefined)
      this.siteRole = changes.siteRole;
    if (changes.friend !== undefined)
      this.friend = changes.friend;
    if (changes.blocked !== undefined)
      this.blocked = changes.blocked;
    if (changes.siteBanned !== undefined)
      this.siteBanned = changes.siteBanned;
    if (changes.siteDisabled !== undefined)
      this.siteDisabled = changes.siteDisabled;
  }

  clear() {
    for (channel of this.channels.values()) {
      channel.removeUser(this);
    }
    this.channels.clear();
  }
}
