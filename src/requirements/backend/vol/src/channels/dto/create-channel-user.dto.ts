import {
  IsString,
  IsNumber,
  IsBoolean,
} from 'class-validator';
export class CreateChannelUserDto {
  @IsString()
  channelId: string;

  @IsNumber()
  userId: number;

  @IsBoolean()
  admin: boolean;
}
