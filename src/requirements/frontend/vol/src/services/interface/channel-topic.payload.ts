import {
    User,
} from '../model';

export interface ChannelTopicPayload {
    user: User,
    establishedDate: Date,
    value: string,
}
