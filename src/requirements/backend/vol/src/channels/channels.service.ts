import {
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelsRepository: Repository<Channel>,
    //TODO: private chat: Chat,
  ) {}

  async create(createChannelDto: CreateChannelDto): Promise<Channel> {
    const newChannel = this.channelsRepository.create(createChannelDto);
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
	
  async addUserToChannel(channelId: string, user: User): Promise<Channel> {
    const channel = await this.findOneById(channelId);
    channel.users.push(user);
    return this.channelsRepository.save(channel);
  }

  async removeUserFromChannel(channelId: string, userId: number): Promise<Channel> {
    const channel = await this.findOneById(channelId);
    channel.users = channel.users.filter((user) => user.id !== userId);
    return this.channelsRepository.save(channel);
  }

  async addAdminToChannel(channelId: string, admin: User): Promise<Channel> {
    const channel = await this.findOneById(channelId);
    channel.admins.push(admin);
    return this.channelsRepository.save(channel);
  }

  async removeAdminFromChannel(channelId: string, adminId: number): Promise<Channel> {
    const channel = await this.findOneById(channelId);
    channel.admins = channel.admins.filter((admin) => admin.id !== adminId);
    return this.channelsRepository.save(channel);
  }

  async addBannedUserToChannel(channelId: string, bannedUser: User): Promise<Channel> {
    const channel = await this.findOneById(channelId);
    channel.banned.push(bannedUser);
    return this.channelsRepository.save(channel);
  }

  async removeBannedUserFromChannel(channelId: string, bannedUserId: number): Promise<Channel> {
    const channel = await this.findOneById(channelId);
    channel.banned = channel.banned.filter((user) => user.id !== bannedUserId);
    return this.channelsRepository.save(channel);
  }

  async addMutedUserToChannel(channelId: string, mutedUser: User): Promise<Channel> {
    const channel = await this.findOneById(channelId);
    channel.muted.push(mutedUser);
    return this.channelsRepository.save(channel);
  }

  async removeMutedUserToChannel(channelId: string, mutedUserId: number): Promise<Channel> {
    const channel = await this.findOneById(channelId);
    channel.muted = channel.muted.filter((user) => user.id !== mutedUserId);
    return this.channelsRepository.save(channel);
  }
}
