import { IsString } from 'class-validator';

export class ReturnBanDto {
  @IsString()
  id: string;

  @IsString()
  userId: string;

  @IsString()
  channelId: string;
}
