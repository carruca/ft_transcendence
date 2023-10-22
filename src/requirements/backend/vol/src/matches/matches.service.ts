import { Injectable } from '@nestjs/common';
import { CreateMatchDto, UserStats } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { Match } from './entities/match.entity';
import { MatchUser } from './entities/match-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PaginationOptionsDto } from './dto/pagination-options.dto';
import { PaginationDto } from './dto/pagination.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,

    @InjectRepository(MatchUser)
    private matchUsersRepository: Repository<MatchUser>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createMatchUsers(match: Match, users: UserStats[]): Promise<void> {
    for (const user of users) {
      const matchUser = new MatchUser(
        user.score,
        user.id,
        match,
	    );
      match.users.push(matchUser);
    }
  }

  async create(createMatchDto: CreateMatchDto): Promise<void> {
    const match = new Match(
      createMatchDto.mode,
      createMatchDto.start,
      createMatchDto.end,
    );
    match.users = [];

    await this.matchesRepository.save(match);

    await this.createMatchUsers(match, createMatchDto.winners);
    await this.createMatchUsers(match, createMatchDto.losers);

    await this.matchUsersRepository.save(match.users);

    for (const user of createMatchDto.winners) {
      match.winners.push(user.id)
    }
    await this.matchesRepository.save(match);
    await this.updateEloRating(createMatchDto.winners[0].id, createMatchDto.losers[0].id);
  }

  async findAll(): Promise<Match[]> {
    return this.matchesRepository.find();
  }

  async history(id: number): Promise<Match[]> {
    const matchUsers = await this.matchUsersRepository.find({
      where: { userId: id },
      relations: ['match'],
    });

    const matchHistory = matchUsers.map(matchUser => matchUser.match);
    return matchHistory.sort((a,b) => b.start.getTime() - a.start.getTime());
  }

  async paginate(
    id: number,
    options: PaginationOptionsDto,
  ): Promise<PaginationDto<Match>> {
    const [ results, total ] = await this.matchUsersRepository.findAndCount({
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

    return {
      results: results.map(matchUser => matchUser.match),
      currentPage: options.page,
      total: total,
    };
  }

  getMockUser(id: number): string {
    if (id == 1)
      return 'paco';
    return 'jones';
  }

  async updateEloRating(winner: number, loser: number): Promise<void> {
    const winningUsers = await this.usersRepository.find({
      where: {
        nickname: this.getMockUser(winner),
      }
    });
    const losingUsers = await this.usersRepository.find({
      where: {
        nickname: this.getMockUser(loser),
      }
    });
	//TODO: change to actual users
/*    const winningUsers = await this.usersRepository.find({
      where: {
        id: In(winners),
      },
    });
    const losingUsers = await this.usersRepository.find({
      where: {
        id: In(losers),
      },
    });
*/
    const ratingDifference = losingUsers.reduce((total, loser) => {
      return total + (loser.rating - 100);
    }, 0);

    const pointsGained = Math.round(32 * (1 - 1 / (1 + Math.pow(10, ratingDifference / 400))));

    winningUsers.forEach((winner) => {
      winner.rating += pointsGained;
      ++winner.wins;
    });

    losingUsers.forEach((loser) => {
      loser.rating -= pointsGained;
      ++loser.losses;
    });

    await this.usersRepository.save([...winningUsers, ...losingUsers]);
  }

  async findOne(id: number) {
    return this.matchesRepository.findOneBy({ id });
  }

  async remove(id: number) {
    return this.matchesRepository.delete(id);
  }
}
