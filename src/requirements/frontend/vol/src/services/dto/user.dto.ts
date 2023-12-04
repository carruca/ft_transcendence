import {
    UserStatusEnum,
    UserSiteRoleEnum,
} from '../enum';

import type {
    ChannelDTO,
} from '.';

export interface UserDTO {
    id: string,
    nickname: string,
    status: UserStatusEnum,
    siteRole: UserSiteRoleEnum,
    siteDisabled?: boolean,
    siteBanned?: boolean,
    blocked: boolean,
    friend: boolean,
    channelsDTO?: ChannelDTO[],
}
