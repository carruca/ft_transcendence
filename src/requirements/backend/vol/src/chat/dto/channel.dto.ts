import {
  ChannelModel as Channel,
} from '../models';

import {
  ChannelUserDTO,
} from '../dto';

import {
  ChannelTopicDTO,
} from '.';

export class ChannelDTO {
  public readonly uuid: string;
  public readonly name: string;
  public readonly creationDate: Date;
  public readonly ownerUserUUID: string;
  public readonly topic?: ChannelTopicDTO;
  public readonly hasPassword: boolean;
  public readonly users: ChannelUserDTO[];

  constructor (channel: Channel) {
    this.uuid = channel.uuid;
    this.name = channel.name;
    this.creationDate = channel.creationDate;
    this.ownerUserUUID = channel.ownerUser.uuid;
    this.topic = channel.topic && channel.topic.value !== "" ? new ChannelTopicDTO(channel.topic) : undefined;
    this.hasPassword = (channel.password !== undefined);
    this.users = channel.getUsers().map((user) => new ChannelUserDTO(channel, user));
  }
}
