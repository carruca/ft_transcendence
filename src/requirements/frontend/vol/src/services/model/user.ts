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
  public readonly uuid: string;
  public name: string;
  public siteRole: UserSiteRoleEnum;
  public status: UserStatusEnum;
  public friend: boolean;
  public blocked: boolean;
  public readonly channels = new Map<Channel>;

  constructor(userDTO: UserDTO) {
    this.uuid = userDTO.uuid;
    this.name = userDTO.name;
    this.siteRole = userDTO.siteRole ?? UserSiteRoleEnum.NONE;
    this.status = userDTO.status ?? UserStatusEnum.OFFLINE;
    this.friend = userDTO.friend ?? false;
    this.blocked = userDTO.blocked ?? false;
  }

  addChannel(channel: Channel) {
    this.channels.set(channel.uuid, channel);
  }
}
