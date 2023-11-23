import {
  ChannelModel as Channel,
} from '../model';

import {
  UserDTO,
  EventDTO,
  ChannelUserDTO,
  ChannelTopicDTO,
} from '.';

export class ChannelDTO {
  uuid: string;
  name: string;
  creationDate: Date;
  ownerUserDTO: UserDTO;
  topic?: ChannelTopicDTO;
  hasPassword: boolean;
  users: ChannelUserDTO[];
  events: EventDTO[];

  constructor (channel: Channel) {
    this.uuid = channel.uuid;
    this.name = channel.name;
    this.creationDate = channel.creationDate;
    this.ownerUserDTO = channel.ownerUser.DTO;
    this.topic = channel.topic && channel.topic.value !== "" ? new ChannelTopicDTO(channel.topic) : undefined;
    this.hasPassword = (channel.password !== null);
    this.users = channel.getUsers().map((user) => new ChannelUserDTO(channel, user));
    this.events = channel.getEvents().map((event) => event.DTO);
  }
}
