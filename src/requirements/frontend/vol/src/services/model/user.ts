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
  public name: string;
  public siteRole: UserSiteRoleEnum;
  public status: UserStatusEnum;
  public friend: boolean;
  public blocked: boolean;
  public readonly channels = new Set<Channel>;

  constructor(userDTO: UserDTO) {
    this.id = userDTO.id;
    this.nickname = userDTO.nickname;
    this.siteRole = userDTO.siteRole ?? UserSiteRoleEnum.NONE;
    this.status = userDTO.status ?? UserStatusEnum.OFFLINE;
    this.friend = userDTO.friend ?? false;
    this.blocked = userDTO.blocked ?? false;
  }

  addChannel(channel: Channel) {
    this.channels.add(channel);
  }

  delChannel(channel: Cannel) {
    this.channels.delete(channel);
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
  }

  clear() {
    for (channel of this.channels) {
      channel.removeUser(this);
    }
    this.channels.clear();
  }
}
