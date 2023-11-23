import { 
  UserModel as User,
} from '../models';

export interface ChannelTopicPayload {
  user: User;
  establishedDate?: Date;
  value: string;
}
