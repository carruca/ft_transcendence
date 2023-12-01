import {
    Channel
} from '../model';

import {
    UserSiteRoleEnum,
    UserStatusEnum,
} from '../enum';

export interface UserPayload {
    id: string,
    nickname: string,
    status?: UserStatusEnum,
    siteRole?: UserSiteRoleEnum,
    siteDisabled?: boolean,
    siteBanned?: boolean,
    blocked?: boolean,
    friend?: boolean,
    channels?: Channel[],
}
