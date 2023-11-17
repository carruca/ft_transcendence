import { UserStatus, UserChannelRole, UserSiteRole } from '../enums'

import {
    UserModel as User,
    ChannelModel as Channel,
} from '../models';

export class ChannelUserDTO {
    readonly uuid: string;
    readonly name: string;
    readonly status: UserStatus;
    readonly siteRole: UserSiteRole;
    readonly channelRole: UserChannelRole;
    readonly isMuted: boolean;

    constructor(channel: Channel, user: User) {
        this.uuid = user.uuid;
        this.name = user.name;
        this.status = user.status;
        this.siteRole = user.siteRole;

        if (channel.hasOper(user))
          this.channelRole = UserChannelRole.ADMIN;
        if (channel.owner === user)
          this.channelRole = UserChannelRole.OWNER;
        this.isMuted = channel.hasMuted(user);
    }
}
