import { UserStatus } from './user-status';

export enum UserChannelRole {
    OWNER = 1,
    ADMIN = 2,
}

export enum UserSiteRole {
    OWNER = 1,
    MODERATOR = 2,
}

export interface UserDetails {
    uuid?: string;
    name?: string;
    status?: UserStatus;
    siteRole?: UserSiteRole;
    typing?: boolean;
}
