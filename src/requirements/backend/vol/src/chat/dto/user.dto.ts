import {
  UserStatusEnum,
  UserSiteRoleEnum,
} from '../enum';

import {
  UserModel as User,
} from '../model';

import {
  ChannelDTO,
} from '../dto';

export class UserDTO {
  uuid: string;
  name: string;
  status: UserStatusEnum;
  siteRole: UserSiteRoleEnum;
  friend: boolean;
  blocked: boolean;
  channels: ChannelDTO[];

  constructor(user: User) {
    this.uuid = user.uuid;
    this.name = user.name;
    this.status = user.status;
    this.siteRole = user.siteRole;
  }
}
