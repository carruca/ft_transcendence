import {
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
  forwardRef,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateBlockDto } from './dto/create-block.dto';
import { CreateBanDto } from './dto/create-ban.dto';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserMode } from './entities/user.entity';
import { Block } from './entities/block.entity';
import { Ban } from './entities/ban.entity';
import * as fs from 'fs';
import * as path from 'path';
import { AchievementUser } from '../achievements/entities/achievement-user.entity';
import { Channel } from '../channels/entities/channel.entity';
import { ChannelUser } from '../channels/entities/channel-user.entity';
import { RatingUserDto } from './dto/rating-user.dto';
import { Friend, FriendStatus } from '../friends/entities/friend.entity';
import { ChatManager } from '../chat/manager';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Block)
    private blocksRepository: Repository<Block>,
    @InjectRepository(Ban)
    private bansRepository: Repository<Ban>,
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,
    @Inject(forwardRef(() => ChatManager))
    private chatManager: ChatManager,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = new User(
      createUserDto.id,
      createUserDto.displayname.replace(/[\p{L}]\S*/gu, (w) => (w.replace(/^\p{L}/u, (c) => c.toUpperCase()))),
      createUserDto.login
    );
    newUser.achievements = [];
    newUser.channels = [];
    newUser.friends = [];
    newUser.matches = [];
    newUser.blocks = [];
    newUser.bans = [];
    return this.usersRepository.save(newUser);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findAllWithChannels(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['channels'],
    });
  }

  async findOneByIntraId(intraId: number): Promise<User | null> {
    const user = await this.usersRepository.findOneBy({ intraId: intraId });
    return user;
  }

  async findOne(id: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ id });
  }

  async findOneById(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: id });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
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
    this.chatManager.changeNickUserId(user.id, nick);
    return this.usersRepository.save(user);
  }

  async setMode(id: string, mode: UserMode) {
    const user = await this.findOne(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    user.mode = mode;
    return this.usersRepository.save(user);
  }

  async setDisabled(id: string, value: boolean) {
    const user = await this.findOne(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    user.disabled = value;
    return this.usersRepository.save(user);
  }

  async setBanned(id: string, value: boolean) {
    const user = await this.findOne(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    user.banned = value;
    return this.usersRepository.save(user);
  }

  async createBan(createBanDto: CreateBanDto) : Promise<Ban> {
    const user = await this.usersRepository.findOne({
      relations: ['bans'],
      where: {
        id: createBanDto.userId,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const channel = await this.channelsRepository.findOne({
      relations: ['bans'],
      where: {
        id: createBanDto.channelId,
      },
    });
    if (!channel) {
      throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
    }

    const newBan = new Ban(
      user,
      channel,
    );
    await this.bansRepository.save(newBan);
    user.bans.push(newBan);
    await this.usersRepository.save(user);
    channel.bans.push(newBan);
    await this.channelsRepository.save(channel);
    return newBan;
  }

  async getBansByUser(userId: string) {
    const user = await this.usersRepository.findOne({
      relations: ['bans'],
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user.bans;
  }

  async removeBan(userId: string, channelId: string) {
    const user = await this.usersRepository.findOne({
      relations: ['bans'],
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const channel = await this.channelsRepository.findOne({
      relations: ['bans'],
      where: {
        id: channelId,
      },
    });
    if (!channel) {
      throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
    }

    await this.bansRepository.delete({ user, channel });
  }

  async createBlock(createBlockDto: CreateBlockDto) : Promise<Block> {
    const user = await this.usersRepository.findOne({
      relations: ['blocks'],
      where: {
        id: createBlockDto.userId,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const newBlock = new Block(
      user,
      createBlockDto.blockId
    );
    await this.blocksRepository.save(newBlock);
    user.blocks.push(newBlock);
    await this.usersRepository.save(user);
    return newBlock;
  }

  async getBlocks(userId: string) : Promise<Block[]> {
    const user = await this.usersRepository.findOne({
      relations: ['blocks'],
      where: {
        id: userId
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user.blocks;
  }

  async removeBlock(userId: string, blockId: string) : Promise<void> {
    const user = await this.usersRepository.findOne({
      relations: ['blocks'],
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const block = await this.blocksRepository.findOne({
      where: {
        user: user,
	      blockId: blockId
      },
    });
    if (!block) {
      throw new HttpException('Block not found', HttpStatus.NOT_FOUND);
    }

    user.blocks.filter((userBlock) => userBlock.id != block.id);
    await this.usersRepository.save(user);
    await this.blocksRepository.delete(block);
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

  async findChannelsUser(userId: string): Promise<ChannelUser[]> {
    const user = await this.usersRepository.findOne({
      relations: ['channels'],
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user.channels;
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
      nickname: user.nickname!,
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
