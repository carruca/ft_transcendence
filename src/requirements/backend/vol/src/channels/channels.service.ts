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

import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelsRepository: Repository<Channel>,

    @InjectRepository(ChannelUser)
    private readonly channelUsersRepository: Repository<ChannelUser>,

    //TODO: private chat: Chat,
  ) {}

  async create(createChannelDto: CreateChannelDto): Promise<Channel> {
    const newChannel = new Channel(createChannelDto);
    return this.channelsRepository.save(newChannel);
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
    const channel = await this.findOneById(createChannelUserDto.channelId);
    const channelUser = new ChannelUser(
      channel,
	  createChannelUserDto.userId,
	  createChannelUserDto.admin,
    );
    await this.channelUsersRepository.save(channelUser);

    channel.users.push(channelUser);
    await this.channelsRepository.save(channel);

    return channelUser;
  }

  async removeChannelUser(channelId: string, userId: number): Promise<Channel> {
	const channel = await this.findOneById(channelId);
    const channelUser = await this.findChannelUserById(channel, userId);

	await this.channelUsersRepository.delete(channelUser);
	channel.users = channel.users.filter(user => user.id !== userId);
	return this.channelsRepository.save(channel);
  }

  async findChannelUserById(channel: Channel, userId: number) : Promise<ChannelUser> {
    const channelUser = await this.channelUsersRepository.findOne({
      where: {
        channel,
        userId,
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

  async setAdminToChannelUser(channelId: string, userId: number): Promise<ChannelUser> {
	const channel = await this.findOneById(channelId);
    const channelUser = await this.findChannelUserById(channel, userId);

	channelUser.admin = true;
    return this.channelUsersRepository.save(channelUser);
  }

  async unsetAdminToChannelUser(channelId: string, userId: number): Promise<ChannelUser> {
	const channel = await this.findOneById(channelId);
    const channelUser = await this.findChannelUserById(channel, userId);

	channelUser.admin = false;
    return this.channelUsersRepository.save(channelUser);
  }

  async setBannedToChannelUser(channelId: string, userId: number): Promise<ChannelUser> {
	const channel = await this.findOneById(channelId);
    const channelUser = await this.findChannelUserById(channel, userId);

	channelUser.banned = true;
    return this.channelUsersRepository.save(channelUser);
  }

  async unsetBannedToChannelUser(channelId: string, userId: number): Promise<ChannelUser> {
	const channel = await this.findOneById(channelId);
    const channelUser = await this.findChannelUserById(channel, userId);

	channelUser.banned = false;
    return this.channelUsersRepository.save(channelUser);
  }

  async setMutedToChannelUser(channelId: string, userId: number): Promise<ChannelUser> {
	const channel = await this.findOneById(channelId);
    const channelUser = await this.findChannelUserById(channel, userId);

	channelUser.muted = true;
    return this.channelUsersRepository.save(channelUser);
  }

  async unsetMutedToChannelUser(channelId: string, userId: number): Promise<ChannelUser> {
	const channel = await this.findOneById(channelId);
    const channelUser = await this.findChannelUserById(channel, userId);

	channelUser.muted = false;
    return this.channelUsersRepository.save(channelUser);
  }
}
