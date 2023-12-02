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
import { ReturnBlockDto } from './dto/return-block.dto';
import { CreateBanDto } from './dto/create-ban.dto';
import { ReturnBanDto } from './dto/return-ban.dto';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
import { FriendsService } from '../friends/friends.service';
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
    private readonly friendsService: FriendsService,
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

  async	findAllWithFriendsAndBlocks(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['friends', 'blocks'],
    })
  }

  findAllWithChannels(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['channels'],
    });
  }

  async findOneByIntraId(intraId: number): Promise<User | null> {
    return await this.usersRepository.findOneBy({ intraId });
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

  async createBan(createBanDto: CreateBanDto) : Promise<ReturnBanDto> {
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
    return {
      id: newBan.id,
      userId: createBanDto.userId,
      channelId: createBanDto.channelId
    };
  }
/*
  async getBansByUser(userId: string) {
    const user = await this.usersRepository.findOne({
      relations: ['bans', 'bans.channel'],
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

//    console.log(user.bans);
    const result = user.bans.map((ban) => ({
      channelId: ban.channel.id,
    }));
    console.log(result);
  }
*/
  async removeBan(userId: string, channelId: string) {
    const ban = await this.bansRepository.findOne({
      where: {
        user: {
          id: userId
        },
        channel: {
          id: channelId
        },
      }
    });
    if (!ban) {
      throw new HttpException('Ban not found', HttpStatus.NOT_FOUND);
    }

    await this.bansRepository.remove(ban);
  }

  async createBlock(createBlockDto: CreateBlockDto) : Promise<ReturnBlockDto> {
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
    return {
      id: newBlock.id,
      userId: createBlockDto.userId,
      blockId: createBlockDto.blockId
    };
  }

  async getBlocks(userId: string) {
    const user = await this.usersRepository.findOne({
      relations: ['blocks'],
      where: {
        id: userId
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const blockIds = user.blocks.map(block => block.blockId);
    const blockUsers = await this.usersRepository.find({
      where: {
        id: In(blockIds)
      },
    });
    if (!blockUsers) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return blockUsers.map(user => ({
      id: user.id,
      nickname: user.nickname,
      login: user.login
    }));
  }

  async removeBlock(userId: string, blockId: string) {
    const block = await this.blocksRepository.findOne({
      where: {
        user: {
          id: userId
        },
        blockId: blockId
      }
    });
    if (!block) {
      throw new HttpException('Block not found', HttpStatus.NOT_FOUND);
    }

    return this.blocksRepository.remove(block);
  }
  
  async setStatus(id: string, status: number) {
    const user = await this.usersRepository.findOne({
      where: {
        id: id
      }
    })
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    user.status = status;
    return this.usersRepository.save(user);
  }

  async findUserFriends(userId: string, status?: FriendStatus) {
    const user = await this.usersRepository.findOne({
      relations: ['friends.users', 'blocks'],
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    let friends = user.friends.filter(friend => (status === undefined || friend.status === status));

    friends = friends.filter(friend => {
      if (!user.blocks.some(block => block.blockId === friend.senderId)) {
        return true;
      } else {
        return false;
      }
    });

    return friends.map(friend => ({
      user: friend.users
        .filter(user => user.id !== userId)
        .map(({ id, nickname, login, status }) => ({ id, nickname, login, status })),
      receiverId: friend.receiverId,
      status: friend.status,
      id: friend.id,
    }));
  }

  async setDefaultStatusToAllUsers() : Promise<void> {
    await this.usersRepository.update({}, { status: 0 });
  }

  async update(id: string, updateUserDto?: UpdateUserDto, avatar?: Express.Multer.File): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    if (updateUserDto?.nickname) {
      const nickRegex = /^[\w](?!.*?\.{2})[\w.]{1,28}[\w]$/;
      if (!nickRegex.test(updateUserDto.nickname)) {
        throw new HttpException('Invalid nickname', HttpStatus.BAD_REQUEST);
      }
      const avatarPath = `public/avatars/${updateUserDto.nickname}.png`;
      if (fs.existsSync(`public/avatars/${user.nickname}.png`)) {
        fs.renameSync(`public/avatars/${user.nickname}.png`, avatarPath);
      }
      user.nickname = updateUserDto.nickname;
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

  async getLeaderboard() : Promise<RatingUserDto[]> {
    let users = await this.usersRepository.find({
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

    users = users.filter(user => user.nickname !== null);

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
