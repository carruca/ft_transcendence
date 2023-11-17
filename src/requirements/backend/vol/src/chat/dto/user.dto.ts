import { UserStatus, UserChannelRole, UserSiteRole } from '../enums';
import { UserModel as User } from '../models';

export class UserDTO {
    readonly uuid: string;
    readonly name: string;
    readonly status: UserStatus;
    readonly siteRole: UserSiteRole;

    constructor(user: User) {
        this.uuid = user.uuid;
        this.name = user.name;
        this.status = user.status;
        this.siteRole = user.siteRole;
    }
}
