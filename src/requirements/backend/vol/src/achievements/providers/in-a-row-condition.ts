import { Injectable } from '@nestjs/common';
import { AchievementCondition } from './achievement-condition';
import { MatchUser } from '../../matches/entities/match-user.entity';
import { Repository } from 'typeorm';
import { UserStats } from '../../matches/dto/create-match.dto';

@Injectable()
export abstract class InARowCondition extends AchievementCondition {
  constructor( 
    protected matchUsersRepository: Repository<MatchUser>,
  ) {
    super();
  }

  protected async evaluateMatchesInARow(userStats: UserStats, maxMatches: number) {
    const matchUsers = await this.matchUsersRepository.find({
      where: {
        userId: userStats.id
      },
      relations: ['match'],
      take: maxMatches,
      order: {
        match: {
          start: "DESC",
        }
      }
    });

//    console.log(`user ${userStats.id} has ${matchUsers.length} matchUsers`);

    if (matchUsers.length !== maxMatches) {
      return false;
    }

    const matches = matchUsers.map(matchUser => matchUser.match);
    let matchesWinInRow = 0;

    for (const match of matches) {
      match.winners.forEach(user => {
        if (user === userStats.id) {
          ++matchesWinInRow;
        }
      })
    }
    if (matchesWinInRow === maxMatches) {
      return true;
    }
    return false;
  }

  abstract evaluate(userStats: UserStats): Promise<boolean>;
}
