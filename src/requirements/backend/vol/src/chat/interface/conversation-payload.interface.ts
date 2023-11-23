import {
  UserModel as User,
} from '../model';

export interface ConversationPayload {
  uuid?: string;
  user1: User;
  user2: User;
}
