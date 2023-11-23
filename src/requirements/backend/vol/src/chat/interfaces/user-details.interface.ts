import {
  UserStatusEnum,
  UserChannelRoleEnum,
  UserSiteRoleEnum,
} from '../enums';

export interface UserDetails {
  uuid: string;
  name?: string;
  status?: UserStatusEnum;
  channelRole?: UserChannelRoleEnum;
  isMuted?: boolean;
  siteRole?: UserSiteRoleEnum;
}
