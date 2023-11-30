import {
  Channel,
} from '../model';

export class ChannelSummaryDTO {
  id: string;
  name: string;
  topic?: string;
  password: boolean;

  constructor(channel: Channel) {
    this.id = channel.id;
    this.name = channel.name;
    this.topic = channel.topic;
    this.password = channel.password || false;
  }
}
