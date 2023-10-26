import {
  IsUUID,
  IsEnum,
} from 'class-validator';
import { FriendStatus } from '../entities/friend.entity';

export class UpdateFriendDto {
  @IsUUID()
  friendId: string;

  @IsEnum(FriendStatus)
  status: FriendStatus;
}
