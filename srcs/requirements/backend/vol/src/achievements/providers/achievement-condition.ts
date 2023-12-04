import { UserStats } from '../../matches/dto/create-match.dto';

export abstract class AchievementCondition {
  abstract evaluate(userStats: UserStats): Promise<boolean>;
}
