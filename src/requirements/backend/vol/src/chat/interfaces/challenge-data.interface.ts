import { UserModel as User } from '../models/user.model';

export interface ChallengeData {
  sourceUser: User;
  targetUser: User;
}
