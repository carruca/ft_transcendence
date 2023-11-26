import {
  User,
} from '../model';

export interface ConversationPayload {
  id?: string;
  user1: User;
  user2: User;
}
