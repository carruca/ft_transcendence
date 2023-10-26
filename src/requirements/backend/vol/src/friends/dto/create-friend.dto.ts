import { IsNumber } from 'class-validator';

export class CreateFriendDto {
  @IsNumber()
  senderId: number;

  @IsNumber()
  receiverId: number;
}
