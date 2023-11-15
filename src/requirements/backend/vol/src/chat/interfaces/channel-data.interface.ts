import { UserModel as User } from '../models'
import { ChannelTopic } from '.'

export interface ChannelData {
    uuid: string;
    name: string;
    owner: User;
    topic?: ChannelTopic;
    password?: string;
}
