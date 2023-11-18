import {
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CreateFriendDto } from './dto/create-friend.dto';
import { UpdateFriendDto } from './dto/update-friend.dto';
import { ReturnFriendDto } from './dto/return-friend.dto';

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

  async create(createFriendDto: CreateFriendDto) : Promise<ReturnFriendDto> {
    const users = await this.usersRepository.find({
      relations: ['friends'],
      where: {
        id: In([
          createFriendDto.receiverId,
          createFriendDto.senderId,
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

  async updateStatus(updateFriendDto: UpdateFriendDto) : Promise<Friend> {
    const friend = await this.friendsRepository.findOne({
      where: {
        id: updateFriendDto.friendId,
      },
    });
    if (!friend) {
      throw new HttpException('Friend not found', HttpStatus.NOT_FOUND);
    }
    friend.status = updateFriendDto.status;
    return this.friendsRepository.save(friend);
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
