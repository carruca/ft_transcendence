import { FriendStatus } from '../entities/friend.entity';

export class ReturnFriendDto {
  id: string;
  receiverId: string;
  status: FriendStatus;
}
