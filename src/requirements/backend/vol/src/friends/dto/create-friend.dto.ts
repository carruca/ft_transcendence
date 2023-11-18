import { IsString } from 'class-validator';

export class CreateFriendDto {
  @IsString()
  senderId: string;

  @IsString()
  receiverId: string;
}
