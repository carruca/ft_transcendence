import { UserStatus, UserChannelRole, UserSiteRole } from '../enums';

export interface UserDetails {
  uuid: string;
  name?: string;
  status?: UserStatus;
  channelRole?: UserChannelRole;
  isMuted?: boolean;
  siteRole?: UserSiteRole;
}
