import {
  UserModel as User,
} from '../models/user.model';

export interface ChallengePayload {
  sourceUser: User;
  targetUser: User;
}
