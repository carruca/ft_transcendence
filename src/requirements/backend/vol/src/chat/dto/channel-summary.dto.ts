import {
  ChannelModel as Channel,
} from '../model';

export class ChannelSummaryDTO {
  uuid: string;
  name: string;
  topic: string;
  hasPassword: boolean;

  constructor(channel: Channel) {
    this.uuid = channel.uuid;
    this.name = channel.name;
    this.topic = channel.topic && channel.topic.value !== "" ? channel.topic.value : "";
    this.hasPassword = channel.password?.length != 0 ?? false;
  }
}
