import {
  UserStatusEnum,
  UserChannelRoleEnum,
  UserSiteRoleEnum,
} from '../enums'

import {
  UserModel as User,
  ChannelModel as Channel,
} from '../models';

export class ChannelUserDTO {
  readonly uuid: string;
  readonly name: string;
  readonly status: UserStatusEnum;
  readonly siteRole: UserSiteRoleEnum;
  readonly channelRole: UserChannelRoleEnum;
  readonly isMuted: boolean;
  readonly isBanned: boolean;

  constructor(channel: Channel, user: User) {
    this.uuid = user.uuid;
    this.name = user.name;
    this.status = user.status;
    this.siteRole = user.siteRole;

    if (channel.hasOper(user))
      this.channelRole = UserChannelRoleEnum.ADMIN;

    if (channel.ownerUser === user)
      this.channelRole = UserChannelRoleEnum.OWNER;

    this.isMuted = channel.hasMuted(user);
    this.isBanned = channel.hasBanned(user);
  }
}
