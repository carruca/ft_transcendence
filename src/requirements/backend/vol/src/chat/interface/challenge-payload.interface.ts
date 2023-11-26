import {
  User,
} from '../model';

export interface ChallengePayload {
  sourceUser: User;
  targetUser: User;
}
