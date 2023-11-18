import { UserModel as User } from '../models';

export interface ChannelTopic {
  user: User;
  setDate: Date;
  value: string;
}
