import {
  UserStatusEnum,
  UserSiteRoleEnum,
} from '../enums';

import {
  UserModel as User,
} from '../models';

export class UserDTO {
  readonly intraId: number;
  readonly uuid: string;
  readonly name: string;
  readonly status: UserStatusEnum;
  readonly siteRole: UserSiteRoleEnum;
  readonly banned: boolean;
  readonly disabled: boolean;
  friend: boolean;
  //TODO la amistad se tiene que verificar con hasFriend(sourceUser);

  constructor(user: User) {
    this.intraId = user.intraId;
    this.uuid = user.uuid;
    this.name = user.name;
    this.status = user.status;
    this.siteRole = user.siteRole;
    this.banned = user.isBanned;
    this.disabled = user.isDisabled;
  }
}
