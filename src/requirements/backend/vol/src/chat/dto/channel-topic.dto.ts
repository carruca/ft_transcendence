import { ChannelTopic } from '../interfaces';

export class ChannelTopicDTO {
  readonly userUUID: string;
  readonly setDate: Date;
  readonly value: string;

  constructor(topic: ChannelTopic) {
    this.userUUID = topic.user.uuid;
    this.setDate = topic.setDate;
    this.value = topic.value;
  }
}
