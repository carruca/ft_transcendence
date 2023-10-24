import { FriendStatus } from '../entities/friend.entity';
import {
  IsUUID,
  IsEnum,
} from 'class-validator';

export class UpdateFriendDto {
  @IsUUID()
  friendId: string;

  @IsEnum(FriendStatus)
  status: FriendStatus;
}
