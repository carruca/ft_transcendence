import { ChannelModel as Channel } from '../models';

export class ChannelSummaryDTO {
  readonly uuid: string;
  readonly name: string;
  readonly topic: string;
  readonly hasPassword: boolean;

  constructor(channel: Channel) {
    this.uuid = channel.uuid;
    this.name = channel.name;
    this.topic = channel.topic && channel.topic.value !== "" ? channel.topic.value : "";
    this.hasPassword = channel.password?.length != 0 ?? false;
  }
}
