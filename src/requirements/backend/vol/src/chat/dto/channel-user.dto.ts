import {
  UserDTO,
} from '.';

import {
  User,
  Channel,
} from '../model';

export class ChannelUserDTO {
  owner: boolean;
  admin: boolean;
  muted: boolean;
  banned: boolean;
  active: boolean;
  userDTO: UserDTO;
  channelId: string;

  constructor(channel: Channel, user: User) {
    this.owner = (channel.owner == user);
    this.admin = channel.isAdmin(user);
    this.muted = channel.isMuted(user);
    this.banned = channel.isBanned(user);
    this.userDTO = user.DTO;
    this.channelId = channel.id;
  }
}
