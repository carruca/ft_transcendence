import { 
  UserModel as User,
} from '../model';

import {
  ChannelTopicPayload,
} from '../interface';

import {
  ChannelTopicDTO,
} from '../dto';

export class ChannelTopicModel {
  public user: User;
  public establishedDate: Date;
  public value: string;

  constructor(channelTopicPayload: ChannelTopicPayload) {
    this.user = channelTopicPayload.user;
    this.establishedDate = channelTopicPayload.establishedDate ?? new Date();
    this.value = channelTopicPayload.value;
  }

  get DTO(): ChannelTopicDTO {
    return new ChannelTopicDTO(this);
  }
}