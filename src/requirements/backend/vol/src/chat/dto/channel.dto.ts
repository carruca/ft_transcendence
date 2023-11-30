import {
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

  constructor (channel: Channel) {
    this.id = channel.id;
    this.name = channel.name;
    this.createdDate = channel.createdDate;
    this.ownerDTO = channel.owner.DTO;
    this.topic = channel.topic;
    this.topicSetDate = channel.topicSetDate,
    this.topicUserDTO = channel.topicUser?.DTO;
    this.password = (channel.password !== null);
    this.channelUsersDTO = channel.getUsers().map((user) => new ChannelUserDTO(channel, user));
    this.eventsDTO = channel.getEvents().map((event) => event.DTO);
  }
}
