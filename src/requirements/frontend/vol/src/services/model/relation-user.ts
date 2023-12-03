import { UserStatusEnum } from '@/services/enum';

export enum RelationStatusEnum {
  PENDING = 0,
  ACCEPTED = 1,
  REJECTED = 2,
  BLOCKED = 3,
}

export class RelationUser {
  id: number;
  nickname: string;
  login: string;
  userProfile: string;
  relationStatus: number;
  userStatus: number;

  constructor(user: any, relationStatus: number) {
    this.id = user.id;
    this.nickname = user.nickname;
    this.login = user.login;
    this.userProfile = ''; // set initially to empty, will be updated later
    this.relationStatus = relationStatus;
    this.userStatus = relationStatus === RelationStatusEnum.BLOCKED ? UserStatusEnum.OFFLINE : user.status;
  }
}
