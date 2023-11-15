import { ChannelTopic } from '.'

export interface ChannelDetails {
    uuid: string;
    name: string;
    topic?: ChannelTopic;
    hasPassword: boolean;
}
