import {
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Channel } from './entities/channel.entity';
import { ChannelUser } from './entities/channel-user.entity';

import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateChannelUserDto } from './dto/create-channel-user.dto';
import { ChannelUserModeDto } from './dto/channel-user-mode.dto';

import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelsRepository: Repository<Channel>,

    @InjectRepository(ChannelUser)
    private readonly channelUsersRepository: Repository<ChannelUser>,

		@InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    //TODO: private chat: Chat,
  ) {}

  async create(createChannelDto: CreateChannelDto): Promise<Channel> {
    const newChannel = new Channel(createChannelDto);
    newChannel.users = [];
    await this.channelsRepository.save(newChannel);

		this.createChannelUser({
      channelId: newChannel.id,
      userId: createChannelDto.ownerId,
      admin: true
    });
    return newChannel;
  }

  async findOneById(id: string): Promise<Channel> {
    const channel = await this.channelsRepository.findOneBy({ id: id });
    if (!channel) {
      throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
    }
    return channel;
  }

  async	findAll(): Promise<Channel[]> {
    return this.channelsRepository.find();
  }

  async remove(id: string) {
    await this.channelsRepository.delete(id);
  }

  async createChannelUser(createChannelUserDto: CreateChannelUserDto): Promise<ChannelUser> {
    const channel = await this.channelsRepository.findOne({
      relations: ['users'],
      where: {
        id: createChannelUserDto.channelId,
      }
    });
    if (!channel) {
      throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
    }

    const user = await this.usersRepository.findOne({
      relations: ['channels'],
      where: {
        id: createChannelUserDto.userId,
      }
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const channelUser = new ChannelUser(
      channel,
	    user,
	    createChannelUserDto.admin,
    );
    await this.channelUsersRepository.save(channelUser);

    channel.users.push(channelUser);
    await this.channelsRepository.save(channel);

    user.channels.push(channelUser);
    await this.usersRepository.save(user);

    return channelUser;
  }

  async removeChannelUser(channelId: string, userId: string): Promise<Channel> {
    const channel = await this.findOneById(channelId);
    const channelUser = await this.findChannelUser(channelId, userId);

    await this.channelUsersRepository.delete(channelUser);
    channel.users = channel.users.filter(user => user.id !== userId);
    return this.channelsRepository.save(channel);
  }

  async findChannelUser(channelId: string, userId: string) : Promise<ChannelUser> {
    const channelUser = await this.channelUsersRepository.findOne({
      relations: ['channel', 'user'],
      where: {
        user: {
          id: userId,
        },
        channel: {
          id: channelId,
        }
      },
    });
    if (!channelUser) {
      throw new HttpException('ChannelUser not found', HttpStatus.NOT_FOUND);
    }

    return channelUser;
  }

  async setChannelTopic(channelId: string, userId: string, topic: string): Promise<Channel> {
    const channel = await this.findOneById(channelId);

    channel.topic = topic;
    channel.topicSetDate = new Date();
    channel.topicUser = userId;
    return this.channelsRepository.save(channel);
  }

  async removeChannelTopic(channelId: string): Promise<Channel> {
    const channel = await this.findOneById(channelId);

    channel.topic = undefined;
    return this.channelsRepository.save(channel);
  }

  async setChannelPassword(channelId: string, password: string): Promise<Channel> {
    const channel = await this.findOneById(channelId);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    channel.password = hashedPassword;
    return this.channelsRepository.save(channel);
  }

  async removeChannelPassword(channelId: string): Promise<Channel> {
    const channel = await this.findOneById(channelId);

    channel.password = undefined;
    return this.channelsRepository.save(channel);
  }

  async verifyChannelPassword(channelId: string, password: string): Promise<boolean> {
    const channel = await this.findOneById(channelId);

    if (!channel.password) {
      return true;
    }
    return await bcrypt.compare(password, channel.password);
  }

  async setAdminToChannelUser(channelUserModeDto: ChannelUserModeDto): Promise<ChannelUser> {
    const channelUser = await this.findChannelUser(
      channelUserModeDto.channelId,
      channelUserModeDto.userId
    );

    channelUser.admin = channelUserModeDto.mode;
    return this.channelUsersRepository.save(channelUser);
  }

  async setBannedToChannelUser(channelUserModeDto: ChannelUserModeDto): Promise<ChannelUser> {
    const channelUser = await this.findChannelUser(
      channelUserModeDto.channelId,
      channelUserModeDto.userId
    );

	  channelUser.banned = channelUserModeDto.mode;
    return this.channelUsersRepository.save(channelUser);
  }

  async setMutedToChannelUser(channelUserModeDto: ChannelUserModeDto): Promise<ChannelUser> {
    const channelUser = await this.findChannelUser(
      channelUserModeDto.channelId,
      channelUserModeDto.userId
    );

	  channelUser.muted = channelUserModeDto.mode;
    return this.channelUsersRepository.save(channelUser);
  }
}
