import type { UserDetails } from './userdetails';

export interface ChannelDetails {
  uuid: string;
  name: string;
  owner: UserDetails;
  topic?: ChannelTopic;
  hasPassword: boolean;
}

export interface ChannelTopic {
  uuid: string;
  date: Date;
  text: string;
}
