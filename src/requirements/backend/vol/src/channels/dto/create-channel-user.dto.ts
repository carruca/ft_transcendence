import {
  IsString,
  IsBoolean,
} from 'class-validator';
export class CreateChannelUserDto {
  @IsString()
  channelId: string;

  @IsString()
  userId: string;

  @IsBoolean()
  admin: boolean;
}
