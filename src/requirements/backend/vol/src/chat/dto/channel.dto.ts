import {
  User,
  Channel,
} from '../model';

import {
  UserDTO,
  EventDTO,
  ChannelUserDTO,
} from '.';

export class ChannelDTO {
  id: string;
  name: string;
  ownerDTO: UserDTO;
  createdDate: Date;
  topic?: string;
  topicSetDate?: Date;
  topicUserDTO?: UserDTO;
  password: boolean;
  channelUsersDTO: ChannelUserDTO[];
  eventsDTO: EventDTO[];

  constructor (channel: Channel, targetUser?: User) {
    this.id = channel.id;
    this.name = channel.name;
    this.createdDate = channel.createdDate;
    this.ownerDTO = channel.owner.DTO(targetUser);
    this.topic = channel.topic;
    this.topicSetDate = channel.topicSetDate,
    this.topicUserDTO = channel.topicUser?.DTO(targetUser);
    this.password = channel.password;
    this.channelUsersDTO = channel.getUsers().map((user) => new ChannelUserDTO(channel, user, targetUser));
    this.eventsDTO = channel.getEvents().map((event) => event.DTO());
  }
}
