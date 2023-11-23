import {
    EvenTypeEnum,
    UserSiteRoleEnum,
    UserStatusEnum,
} from '../enum';

export class User {
    constructor(
        public readonly uuid: string,
        public name: string,
        public siteRole: UserSiteRoleEnum = UserSiteRoleEnum.NONE,
        public status: UserStatusEnum = UserStatusEnum.OFFLINE,
        public isFriend: boolean = false,
        public isBanned: boolean = false,
        public isDisabled: boolean = false,
    ) {}
}
