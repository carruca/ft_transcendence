import { FriendStatus } from '../entities/friend.entity';
import {
  IsString,
  IsNumber,
} from 'class-validator';

export class ReplyFriendDto {
  @IsString()
  friendId: string;

  @IsNumber()
  status: FriendStatus;
}
