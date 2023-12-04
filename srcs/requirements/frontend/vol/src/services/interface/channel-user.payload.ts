import {
  UserStatusEnum,
  UserSiteRoleEnum,
} from '../enum';

import {
  User,
} from '../model';

export interface ChannelUserPayload {
  user: User,
  admin: boolean,
  owner: boolean,
  muted: boolean,
  banned: boolean,
  channelId?: string,
}
