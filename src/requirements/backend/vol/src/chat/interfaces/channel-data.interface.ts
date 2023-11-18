import { UserModel as User } from '../models';
import { ChannelTopic } from '.';

export interface ChannelData {
    uuid: string;
    name: string;
    owner: User;
    createdDate: Date;
    topic?: ChannelTopic;
    password?: string;
}
