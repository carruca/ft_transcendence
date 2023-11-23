import {
  Socket,
} from 'socket.io';

import {
  UserStatusEnum,
  UserSiteRoleEnum,
} from '../enum';

export interface UserPayload {
  uuid: string,
  name: string,
  intraId: number,
  status?: UserStatusEnum,
  socket?: Socket,
  siteRole?: UserSiteRoleEnum,
  friends?: UserPayload[],
  blocks?: UserPayload[],
}
