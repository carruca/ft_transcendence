import { User } from '../../users/entities/user.entity';

export class CreateChannelDto {
  id?: string;
  name: string;
  owner: string;
  topic?: string;
  password?: string;
}
