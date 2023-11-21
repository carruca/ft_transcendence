import {
  Socket,
} from 'socket.io';

import {
  UserStatusEnum,
  UserSiteRoleEnum,
} from '../enums';

export interface UserPayload {
  uuid: string;
  name: string;
  intraId: number;
  status?: UserStatusEnum;
  socket?: Socket;
  siteRole?: UserSiteRoleEnum;
  banned?: boolean;
  disabled?: boolean;
}
