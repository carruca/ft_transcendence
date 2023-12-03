import {
  UserStatusEnum,
  UserSiteRoleEnum,
} from '../enum';

import {
  User,
} from '../model';

import {
  ChannelDTO,
} from '../dto';

export class UserDTO {
  id: string;
  name?: string;
  nickname: string;
  status: UserStatusEnum;
  siteRole: UserSiteRoleEnum;
  siteDisabled?: boolean;  //solo se da esta información cuando se es admin
  siteBanned?: boolean; //solo se da esta información cuando se es admin
  blocked?: boolean; //a rellenar dependiendo de quien pida el dato
  friend?: boolean;  //a rellenar dependiendo de quien pida el dato
  channelsDTO: ChannelDTO[];

  //TODO: hay que hacer que ciertos campos sean completados según quien haga la solicitud de información
  //para eso, este constructor debe aceptar otro usuario para construir la información a partir del anterior
  constructor(user: User, targetUser?: User) {
    this.id = user.id;
    this.name = user.name;
    this.nickname = user.nickname;
    this.status = user.status;
    this.siteRole = user.siteRole;
    if (targetUser) {
      this.blocked = targetUser.hasBlocked(user);
      this.friend = targetUser.hasFriend(user);
      if (targetUser.siteRole === UserSiteRoleEnum.OWNER || targetUser.siteRole === UserSiteRoleEnum.MODERATOR) {
        this.siteDisabled = user.siteDisabled;
        this.siteBanned = user.siteBanned;
      }
    }
  }
}
