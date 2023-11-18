import { UserStatus, UserChannelRole, UserSiteRole } from '../enums';
import { UserModel as User } from '../models';

import { Socket } from 'socket.io';

export class UserDTO {
  readonly intraId: number;
  readonly uuid: string;
  readonly name: string;
  readonly status: UserStatus;
  readonly siteRole: UserSiteRole;
  readonly banned: boolean;
  readonly disabled: boolean;
  readonly socket?: Socket;

  constructor(user: User) {
    this.intraId = user.intraId;
    this.uuid = user.uuid;
    this.name = user.name;
    this.status = user.status;
    this.siteRole = user.siteRole;
    this.banned = user.isBanned();
    this.disabled = user.isDisabled();
    this.socket = user.socket;
  }
}
