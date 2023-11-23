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

  async createMatchUser(match: Match, user: User, stats: UserStats) {
    const matchUser = new MatchUser(
      stats.score,
      user,
      match
    );
    match.users.push(matchUser);
    user.matches.push(matchUser);
  }

  async create(createMatchDto: CreateMatchDto): Promise<void> {
    const match = new Match(
      createMatchDto.mode,
      createMatchDto.start,
      createMatchDto.end,
    );
    match.users = [];

    await this.matchesRepository.save(match);

    const winners = await this.usersRepository.find({
      relations: ['matches'],
      where: {
        id: In(createMatchDto.winners.map((winner) => winner.id)),
      },
    });
    const losers = await this.usersRepository.find({
      relations: ['matches'],
      where: {
        id: In(createMatchDto.losers.map((loser) => loser.id)),
      },
    });

    winners.forEach(async (user, index) => {
      const stats = createMatchDto.winners[index];
      await this.createMatchUser(match, user, stats);
    });
    losers.forEach(async (user, index) => {
      const stats = createMatchDto.losers[index];
      await this.createMatchUser(match, user, stats);
    });
    await this.updateEloRating(winners, losers);

    await this.matchUsersRepository.save(match.users);
    await this.matchesRepository.save(match);
    await this.usersRepository.save([...winners, ...losers]);
  }

  async findAll(): Promise<Match[]> {
    return this.matchesRepository.find();
  }
/*
  async history(id: string): Promise<Match[]> {
    const matchUsers = await this.matchUsersRepository.find({
      relations: ['match', 'user'],
      where: {
        user: {
          id: id,
        },
      },
    });

    const matchHistory = matchUsers.map(matchUser => matchUser.match);
    return matchHistory.sort((a,b) => b.start.getTime() - a.start.getTime());
  }
*/
  async paginate(
    id: string,
    options: PaginationOptionsDto,
  ): Promise<PaginationDto<Match>> {
    const [ results, total ] = await this.matchUsersRepository.findAndCount({
      relations: ['match', 'user'],
      where: {
        user: {
          id: id,
        },
      },
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

  async updateEloRating(winners: User[], losers: User[]): Promise<void> {
    const ratingDifference = losers.reduce((total, loser) => {
      return total + (loser.rating - 100);
    }, 0);

    const pointsGained = Math.round(32 * (1 - 1 / (1 + Math.pow(10, ratingDifference / 400))));

    winners.forEach((winner) => {
      winner.rating += pointsGained;
      ++winner.wins;
    });

    losers.forEach((loser) => {
      loser.rating -= pointsGained;
      ++loser.losses;
    });
  }

  async findOne(id: string) {
    return this.matchesRepository.findOneBy({ id });
  }

  async remove(id: string) {
    return this.matchesRepository.delete(id);
  }
}
