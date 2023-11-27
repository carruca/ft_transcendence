import { IsString } from 'class-validator';

export class CreateBanDto {
  @IsString()
  userId: string;

  @IsString()
  channelId: string;
}
