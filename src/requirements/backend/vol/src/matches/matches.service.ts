import { Injectable } from '@nestjs/common';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { Match } from './entities/match.entity';
import { MatchUser } from './entities/match-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,

    @InjectRepository(MatchUser)
    private matchUsersRepository: Repository<MatchUser>,
  ) {}

  async create(createMatchDto: CreateMatchDto): Promise<void> {
		const match = new Match();
		match.type = createMatchDto.mode;
		match.start = createMatchDto.start;
		match.end = createMatchDto.end;
		match.users = [];
		const promise = await this.matchesRepository.save(match);
		for (let i = 0; i < createMatchDto.users.length; ++i) {
			const matchUser = new MatchUser();
			matchUser.score = createMatchDto.users[i].score;
			matchUser.userId = createMatchDto.users[i].id;
			matchUser.match = match;
			console.log(matchUser);
			const result = await this.matchUsersRepository.save(matchUser);
			match.users.push(result);
		}
		console.log(promise);
		return ;
	//	return this.matchesRepository.save(match);
  }

  async findAll(): Promise<Match[]> {
    return this.matchesRepository.find();
  }

	async history(id: number): Promise<MatchUser[]> {
    const matchUsers = await this.matchUsersRepository.find({
      where: { userId: id },
      relations: ['match'],
    });
		console.log(matchUsers);
		matchUsers.map(matchUser => {
      const newMatchUser = new MatchUser();
      newMatchUser.id = matchUser.id;
      newMatchUser.score = matchUser.score;
      newMatchUser.userId = matchUser.userId;
      newMatchUser.match = matchUser.match;
      return newMatchUser;
    });
		return matchUsers;
  }
	/*	const userMatches = await this.matchUsersRepository.findBy({ userId: id });
		console.log(userMatches);
		let matchHistory = new Array<MatchUser>();
const prueba = await this.matchUsersRepository.find({
  where: { userId: id },
  relations: ['match']
});
		console.log(prueba);*/
/*		for (const userMatch of userMatches) {
  		const match = await this.matchesRepository.findOne(userMatch.matchId);
  		matchHistory.push({ match, score: userMatch.score, userId: userMarch.userId });
		}
	*/	/*for (let i = 0; i < userMatches.length; ++i) {
			matchHistory.concat(await this.matchUsersRepository.findBy({ match: userMatches[i].match }));
		}
		console.log(matchHistory);
	*//*	return matchHistory;*/

  findOne(id: number) {
    return `This action returns a #${id} match`;
  }

  update(id: number, updateMatchDto: UpdateMatchDto) {
    return `This action updates a #${id} match`;
  }

  remove(id: number) {
    return `This action removes a #${id} match`;
  }
}
