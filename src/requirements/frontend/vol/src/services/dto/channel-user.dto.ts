import {
    UserStatusEnum,
    UserSiteRoleEnum,
    UserChannelRoleEnum,
} from '../enum';

export interface ChannelUserDTO {
    uuid: string,
    nickname: string,
    status: UserStatusEnum,
    admin: boolean,
    owner: boolean,
    muted: boolean,
    banned: boolean,
}
