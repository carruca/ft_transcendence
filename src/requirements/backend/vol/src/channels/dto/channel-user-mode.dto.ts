import {
  IsString,
  IsBoolean,
} from 'class-validator';

export class ChannelUserModeDto {
  @IsString()
  channelId: string;

  @IsString()
  userId: string;

  @IsBoolean()
  mode: boolean;
}
