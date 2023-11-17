import {
  Inject,
	Injectable,
	HttpException,
	HttpStatus,
	forwardRef,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserPermits } from './entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';
import { AchievementUser } from '../achievements/entities/achievement-user.entity';
import { RatingUserDto } from './dto/rating-user.dto';
import { Friend, FriendStatus } from '../friends/entities/friend.entity';
import { ChatManager } from '../chat/managers';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => ChatManager))
    private chatManager: ChatManager,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = new User();
    newUser.intraId = createUserDto.id;
    newUser.name = createUserDto.displayname.replace(/[\p{L}]\S*/gu, (w) => (w.replace(/^\p{L}/u, (c) => c.toUpperCase())));
    newUser.login = createUserDto.login;	
    newUser.nickname = (createUserDto.nickname) ? createUserDto.nickname : createUserDto.login;
    newUser.achievements = [];
    newUser.friends = [];
    return this.usersRepository.save(newUser);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOneByIntraId(intraId: number): Promise<User | null> {
    const user = await this.usersRepository.findOneBy({ intraId: intraId });
    return user;
  }

  async findOne(id: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ id });
  }

  async findOneByNickname(nickname: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ nickname: nickname });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async setNickname(intraId: number, nick: string) : Promise<User> {
    const user = await this.findOneByIntraId(intraId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    user.nickname = nick;
    this.chatManager.changeNickUserIntraId(intraId, nick);
    return this.usersRepository.save(user);
  }

	async setPermits(id: string, permits: UserPermits) {
    const user = await this.findOne(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    user.permits = permits;
    return this.usersRepository.save(user);
	}

  async update(id: string, updateUserDto?: UpdateUserDto, avatar?: Express.Multer.File): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    if (updateUserDto?.nickname) {
      user.nickname = updateUserDto.nickname;
      const avatarPath = `public/avatars/${user.nickname}.png`;
      if (fs.existsSync(`public/avatars/${user.nickname}.png`)) {
        fs.renameSync(`public/avatars/${user.nickname}.png`, avatarPath);
      }
    }
    if (avatar) {
      const avatarPath = `public/avatars/${user.nickname}.png`;
      await this.saveAvatar(avatar, avatarPath);
    }
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async saveAvatar(file: Express.Multer.File, avatarPath: string) {
    if (file.mimetype !== 'image/png') {
      throw new HttpException('Only png files are allowed', HttpStatus.BAD_REQUEST);
    }
    const filePath = path.resolve(avatarPath);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, file.buffer);
  }

  async findAchievementsUser(userId: string): Promise<AchievementUser[]> {
    const user = await this.usersRepository.findOne({
      relations: ['achievements'],
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user.achievements;
  }

  async findFriendsUser(userId: string, status?: FriendStatus) : Promise<Friend[]> {
    console.log(userId);
    const user = await this.usersRepository.findOne({
      relations: ['friends'],
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    if (status) {
      return user.friends.filter(friend => friend.status === status);
    }
    return user.friends;
  }

  async getLeaderboard() : Promise<RatingUserDto[]> {
    const users = await this.usersRepository.find({
      select: [
        'nickname',
        'rating',
        'wins',
        'losses',
      ],
      order: {
        rating: 'DESC',
      },
      take: 10,
    });

    return users.map(user => ({
      nickname: user.nickname,
      rating: user.rating,
      wins: user.wins,
      losses: user.losses,
    }));
  }

  async get2FASecret(userId: string) : Promise<string> {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user.two_fa_token;
  }

  async set2FASecret(userId: string, token: string) : Promise<void> {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    user.two_fa_token = token;
    await this.usersRepository.save(user);
  }

  async get2FAEnabled(userId: string) : Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user.two_fa_enabled && user.two_fa_token == undefined || false;
  }

  async set2FAEnabled(userId: string, enabled: boolean) : Promise<void> {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    user.two_fa_enabled = enabled;
    await this.usersRepository.save(user);
  }
}
