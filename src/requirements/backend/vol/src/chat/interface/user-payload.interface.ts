import {
  Socket,
} from 'socket.io';

import {
  UserStatusEnum,
  UserSiteRoleEnum,
} from '../enum';

import {
  User,
} from '../model';

export interface UserPayload {
  id?: string,
  name?: string,
  nickname: string,
  intraId?: number,
  status?: UserStatusEnum,
  socket?: Socket,
  siteRole?: UserSiteRoleEnum,
  siteBanned?: boolean,
  siteDisabled?: boolean,
  friends?: User[],
  blocks?: User[],
}
