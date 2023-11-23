import {
    UserStatusEnum,
    UserSiteRoleEnum,
} from '../enum';

import {
    ChannelDTO,
} from '.';

export interface UserDTO {
    uuid?: string,
    name: string,
    status?: UserStatusEnum,
    siteRole?: UserSiteRoleEnum,
    blocked?: boolean,
    friend?: boolean,
    channels: ChannelDTO[],
}
