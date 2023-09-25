import { Injectable } from '@nestjs/common';
import { MatchUser } from '../../matches/entities/match-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InARowCondition } from './in-a-row-condition';
import { UserStats } from '../../matches/dto/create-match.dto';

@Injectable()
export class TwoInARowCondition extends InARowCondition {
  constructor( 
    @InjectRepository(MatchUser)
    protected matchUsersRepository: Repository<MatchUser>,
  ) {
    super(matchUsersRepository);
  }

  async evaluate(userStats: UserStats): Promise<boolean> {
	  return this.evaluateMatchesInARow(userStats, 2);
  }
}
