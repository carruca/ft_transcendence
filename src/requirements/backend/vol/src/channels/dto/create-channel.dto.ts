import { User } from '../../users/entities/user.entity';
import { IsString } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  id?: string;

  @IsString()
  name: string;

  @IsString()
  owner: string;

  @IsString()
  topic?: string;

  @IsString()
  password?: string;
}
