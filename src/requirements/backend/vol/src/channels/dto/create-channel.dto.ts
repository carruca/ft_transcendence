import { User } from '../../users/entities/user.entity';
import { IsString, IsDate } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  id?: string;

  @IsString()
  name: string;

  @IsString()
  ownerId: string;

  @IsString()
  topic?: string;

  @IsString()
  password?: string;
}
