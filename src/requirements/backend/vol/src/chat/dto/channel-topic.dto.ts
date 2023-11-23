import {
  ChannelTopicModel as ChannelTopic,
} from '../model';

export class ChannelTopicDTO {
  userUUID: string;
  establishedDate: Date;
  value: string;

  constructor(channelTopic: ChannelTopic) {
    this.userUUID = channelTopic.user.uuid;
    this.establishedDate = channelTopic.establishedDate;
    this.value = channelTopic.value;
  }
}
