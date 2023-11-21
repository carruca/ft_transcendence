import {
  ChannelTopicModel as ChannelTopic,
} from '../models';

export class ChannelTopicDTO {
  public readonly userUUID: string;
  public readonly establishedDate: Date;
  public readonly value: string;

  constructor(channelTopic: ChannelTopic) {
    this.userUUID = channelTopic.user.uuid;
    this.establishedDate = channelTopic.establishedDate;
    this.value = channelTopic.value;
  }
}
