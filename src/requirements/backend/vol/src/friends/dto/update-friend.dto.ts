import {
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FriendStatus } from '../entities/friend.entity';

export class UpdateFriendDto {
  @IsUUID()
  id: string;

  @IsEnum(FriendStatus)
  @ApiProperty({
    enum: FriendStatus,
    description: 'The value (0, 1 or 2).'
  })
  status: FriendStatus;
}
