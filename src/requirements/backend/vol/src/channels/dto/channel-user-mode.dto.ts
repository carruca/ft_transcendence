import {
  IsString,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class ChannelUserModeDto {
  @IsString()
  channelId: string;

  @IsNumber()
  userId: number;

  @IsBoolean()
  mode: boolean;
}
