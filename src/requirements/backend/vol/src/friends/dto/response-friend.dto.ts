import { FriendStatus } from '../entities/friend.entity';

import { IsString } from 'class-validator';

export class ResponseFriendDto {
  @IsString()
  id: string;

  @IsString()
  receiverId: string;

  @IsString()
  senderId: string;

  status: FriendStatus;
}
