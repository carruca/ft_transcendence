import {
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CreateFriendDto } from './dto/create-friend.dto';
import { ReturnFriendDto } from './dto/return-friend.dto';
import { ReplyFriendDto } from './dto/reply-friend.dto';

import {
  Repository,
  In,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Friend, FriendStatus } from './entities/friend.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private friendsRepository: Repository<Friend>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  getMockUser(id: number): string {
    if (id == 1)
      return 'paco';
    return 'jones';
  }

  async create(createFriendDto: CreateFriendDto) : Promise<ReturnFriendDto> {
    const users = await this.usersRepository.find({
      relations: ['friends'],
      where: {
        nickname: In([
          this.getMockUser(createFriendDto.receiverId),
          this.getMockUser(createFriendDto.senderId),
        ]),
      },
    });
    if (!users || users.length === 1) {
      throw new HttpException('Users not found', HttpStatus.NOT_FOUND);
    }

    const newFriend = new Friend(
      users,
      createFriendDto.receiverId,
      FriendStatus.requested,
    );
    await this.friendsRepository.save(newFriend);
    users.forEach((user) => {
      user.friends.push(newFriend);
    });
    await this.usersRepository.save(users);
    return {
      id: newFriend.id,
      receiverId: newFriend.receiverId,
      status: newFriend.status,
    };
  }

  //TODO: reply (accepted/rejected) friendship
  async reply(replyFriendDto: ReplyFriendDto) : Promise<void> {
    const friend = await this.friendsRepository.find();
    return ;
  }

  async findAll() : Promise<Friend[]> {
    return this.friendsRepository.find();
  }

  async findOne(id: string) : Promise<Friend> {
    const friend = await this.friendsRepository.findOneBy({ id });
    if (!friend) {
      throw new HttpException('Friend not found', HttpStatus.NOT_FOUND);
    }
    return friend;
  }

  async remove(id: string) {
    return this.friendsRepository.delete(id);
  }
}
