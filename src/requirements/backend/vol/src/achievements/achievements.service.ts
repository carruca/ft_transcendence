import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { AchievementUser } from './entities/achievement-user.entity';
import { User } from '../users/entities/user.entity';
import { UserStats } from '../matches/dto/create-match.dto';

import { AchievementCondition } from './providers/achievement-condition';
import { TwoInARowCondition } from './providers/two-in-a-row-condition';
import { FiveInARowCondition } from './providers/five-in-a-row-condition';
import { TenInARowCondition } from './providers/ten-in-a-row-condition';
import { ZeroGoalkeeperCondition } from './providers/zero-goalkeeper-condition';
import { PeopleVictoryCondition } from './providers/people-victory-condition';
import { PowerDefeatCondition } from './providers/power-defeat-condition';
import { NarrowVictoryCondition } from './providers/narrow-victory-condition';
import { ComebackVictoryCondition } from './providers/comeback-victory-condition';
import { WinningStreakCondition } from './providers/winning-streak-condition';
import { DoubleTapCondition } from './providers/double-tap-condition';
import { BlockerCondition } from './providers/blocker-condition';
import { FirstPointCondition } from './providers/first-point-condition';
import { PrecisionCondition } from './providers/precision-condition';

@Injectable()
export class AchievementsService {
  private achievementConditions: Map<string, AchievementCondition> = new Map();

  constructor(
    @InjectRepository(Achievement)
    private achievementsRepository: Repository<Achievement>,

    @InjectRepository(AchievementUser)
    private achievementUsersRepository: Repository<AchievementUser>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,

    private twoInARowCondition: TwoInARowCondition,
    private fiveInARowCondition: FiveInARowCondition,
    private tenInARowCondition: TenInARowCondition,
    private zeroGoalkeeperCondition: ZeroGoalkeeperCondition,
    private peopleVictoryCondition: PeopleVictoryCondition,
    private powerDefeatCondition: PowerDefeatCondition,
    private narrowVictoryCondition: NarrowVictoryCondition,
    private comebackVictoryCondition: ComebackVictoryCondition,
    private winningStreakCondition: WinningStreakCondition,
    private doubleTapCondition: DoubleTapCondition,
    private blockerCondition: BlockerCondition,
    private firstPointCondition: FirstPointCondition,
    private precisionCondition: PrecisionCondition,
  ) {
    this.registerAchievementCondition('Porteria a cero', this.zeroGoalkeeperCondition);
    this.registerAchievementCondition('Racha de dos', this.twoInARowCondition);
    this.registerAchievementCondition('Racha de cinco', this.fiveInARowCondition);
    this.registerAchievementCondition('Racha de diez', this.tenInARowCondition);
    this.registerAchievementCondition('Conquista del pueblo', this.peopleVictoryCondition);
    this.registerAchievementCondition('Derrota de la elite', this.powerDefeatCondition);
    this.registerAchievementCondition('Por los pelos', this.narrowVictoryCondition);
    this.registerAchievementCondition('Victoria inesperada', this.comebackVictoryCondition);
    this.registerAchievementCondition('Racha ganadora', this.winningStreakCondition);
    this.registerAchievementCondition('Puntuación relámpago', this.doubleTapCondition);
    this.registerAchievementCondition('Muro impenetrable', this.blockerCondition);
    this.registerAchievementCondition('Primer golpe', this.firstPointCondition);
    this.registerAchievementCondition('Por la escuadra', this.precisionCondition);
  }

  private registerAchievementCondition(name: string, condition: AchievementCondition) {
    this.achievementConditions.set(name, condition);
  }

  async getPending(user: User): Promise<Achievement[]> {
    const all = await this.achievementsRepository.find();
    if (!all){
      throw new NotFoundException('Achievement not found');
    }
    if (user.achievements.length === 0) {
      return all;
    }
    const achieved = user.achievements
      .filter((achievementUser) => achievementUser.achievement && achievementUser.achievement.id)
      .map((achievementUser) => achievementUser.achievement.id);
    return all.filter((achievement) => !achieved.includes(achievement.id));
  }

  getMockUser(id: string | number): string {  // FIXME: remove this
    if (id == 1)
      return 'paco';
    return 'jones';
  }

  async verifyByUser(userStats: UserStats): Promise<void> {
    const user = await this.usersRepository.findOne({
      relations: ['achievements'],
      where: {
        nickname: this.getMockUser(userStats.id),
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const pending = await this.getPending(user);
    for (const achievement of pending) {
      const condition = this.achievementConditions.get(achievement.name);
      if (condition && await condition.evaluate(userStats)) {
        const newAchievementUser = new AchievementUser(user, achievement);
        user.achievements.push(newAchievementUser);
        console.log(`${achievement.name} achieved by ${user.nickname}`);
      }
    }
    if (user.achievements) {
      await this.achievementUsersRepository.save(user.achievements);
    }
    await this.usersRepository.save(user);
  }

  findAll() {
    return this.achievementsRepository.find();
  }

  findOne(id: string) {
    return this.achievementsRepository.findOneBy({ id });
  }

  remove(id: string) {
    return this.achievementsRepository.delete(id);
  }
}
