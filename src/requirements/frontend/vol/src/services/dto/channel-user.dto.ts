import {
    UserStatusEnum,
    UserSiteRoleEnum,
    UserChannelRoleEnum,
} from '../enum';

export interface ChannelUserDTO {
    uuid: string,
    name: string,
    status: UserStatusEnum,
    siteRole: UserSiteRoleEnum,
    blocked: boolean,
    friend: boolean,
    admin: boolean,
    owner: boolean,
    muted: boolean,
    banned: boolean,
}
