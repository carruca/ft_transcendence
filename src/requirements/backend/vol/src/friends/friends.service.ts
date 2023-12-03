import {
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
  forwardRef,
} from '@nestjs/common';
import { CreateFriendDto } from './dto/create-friend.dto';
import { UpdateFriendDto } from './dto/update-friend.dto';
import { ResponseFriendDto } from './dto/response-friend.dto';

import {
  Repository,
  In,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Friend, FriendStatus } from './entities/friend.entity';
import { User } from '../users/entities/user.entity';
import { ChatManager } from '../chat/manager';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private friendsRepository: Repository<Friend>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => ChatManager))
    private chatManager: ChatManager,
  ) {}

  async create(createFriendDto: CreateFriendDto) : Promise<ResponseFriendDto> {
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
      createFriendDto.senderId,
      FriendStatus.requested,
    );
    await this.friendsRepository.save(newFriend);
    users.forEach((user) => {
      user.friends.push(newFriend);
    });
    await this.usersRepository.save(users);

    const response = {
      id: newFriend.id,
      receiverId: newFriend.receiverId,
      senderId: createFriendDto.senderId,
      status: newFriend.status,
    };

    const chatUser = this.chatManager.getUserById(createFriendDto.receiverId);
    if (chatUser && chatUser.socket)
      chatUser.socket.emit('friendship', JSON.stringify(response));
    return response;
  }

  async update(updateFriendDto: UpdateFriendDto) : Promise<Friend> {
    const friend = await this.friendsRepository.findOne({
      where: {
        id: updateFriendDto.id,
      },
    });
    if (!friend) {
      throw new HttpException('Friend not found', HttpStatus.NOT_FOUND);
    }
    if (Number(updateFriendDto.status) === FriendStatus.rejected) {
      return this.remove(updateFriendDto.id);
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
    const friend = await this.friendsRepository.findOne({
      where: {
        id,
      },
    });
    if (!friend) {
      throw new HttpException('Friend not found', HttpStatus.NOT_FOUND);
    }
    return this.friendsRepository.remove(friend);
  }
}
