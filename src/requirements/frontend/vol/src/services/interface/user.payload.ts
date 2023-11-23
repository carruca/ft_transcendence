import {
    ChannelPayload
} from '.';

import {
    UserSiteRoleEnum,
    UserStatusEnum,
} from '../enum';

export interface UserPayload {
    uuid: string,
    name: string,
    status?: UserStatusEnum,
    siteRole?: UserSiteRoleEnum,
    blocked?: boolean,
    friend?: boolean,
    channels: ChannelPayload[],
}
