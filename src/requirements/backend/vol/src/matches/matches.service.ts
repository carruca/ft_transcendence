import { Injectable } from '@nestjs/common';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { Match } from './entities/match.entity';
import { MatchUser } from './entities/match-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationOptionsDto } from './dto/pagination-options.dto';
import { PaginationDto } from './dto/pagination.dto';

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
	//		console.log(matchUser);
			const result = await this.matchUsersRepository.save(matchUser);
			match.users.push(result);
		}
//		console.log(promise);
		return ;
	//	return this.matchesRepository.save(match);
  }

  async findAll(): Promise<Match[]> {
    return this.matchesRepository.find();
  }

	async history(id: number): Promise<Match[]> {
		const matchUsers = await this.matchUsersRepository.find({
			where: { userId: id },
			relations: ['match'],
    });
//		console.log(matchUsers);
		const matchHistory = matchUsers.map(matchUser => matchUser.match);
		return matchHistory.sort((a,b) => b.start.getTime() - a.start.getTime());
  }

	async paginate(
		id: number,
		options: PaginationOptionsDto,
	): Promise<PaginationDto<Match>> {
			const [ results, total ] = await this.matchUsersRepository.createQueryBuilder('matchUser')
				.where('matchUser.userId = :userId', { userId: id })
				.orderBy('matchUser.match.start', 'DESC')
				.take(options.limit)
				.skip(options.page * options.limit)
				.getManyAndCount();
/*		const [ results, total ] = await this.matchUsersRepository.findAndCount({
			where: { userId: id },
			relations: ['match'],
			take: options.limit,
			skip: options.page * options.limit,
			order: {
				match: {
					start: "DESC",
				}
			}
		});
*/
		return {
			data: results.map(matchUser => matchUser.match),
			currentPage: options.page,
			total: total,
		};
	}

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
