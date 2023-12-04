import {
    UserStatusEnum,
} from '../enum';

import type {
	UserDTO,
} from '.';

export interface ChannelUserDTO {
	userDTO: UserDTO,
    id: string,
    nickname: string,
    status: UserStatusEnum,
    admin: boolean,
    owner: boolean,
    muted: boolean,
    banned: boolean,
}
