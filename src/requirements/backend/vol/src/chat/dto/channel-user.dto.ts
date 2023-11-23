import {
  UserStatusEnum,
  UserSiteRoleEnum,
} from '../enum'

import {
  UserModel as User,
  ChannelModel as Channel,
} from '../model';

export class ChannelUserDTO {
  uuid: string;
  name: string;
  status: UserStatusEnum;
  siteRole: UserSiteRoleEnum;
  blocked: boolean;
  friend: boolean;
  admin: boolean;
  owner: boolean;
  muted: boolean;
  banned: boolean;

  constructor(channel: Channel, user: User) {
    this.uuid = user.uuid;  //User
    this.name = user.name;  //User
    this.status = user.status;  //User
    this.siteRole = user.siteRole;
    this.blocked = false; //User
    this.friend = false;  //User
    this.admin = channel.hasOper(user);
    this.owner = (channel.ownerUser === user);
    this.muted = channel.hasMuted(user); //ChannelUser
    this.banned = channel.hasBanned(user); //ChannelUser
  }
}
