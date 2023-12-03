import {
    Event,
    ChannelUser,
} from '../model';

import {
	User,
 } from '../model';

export interface ChannelPayload {
    id: string,
    name: string,
    createdDate: Date,
    owner: User,
    topic?: string,
    topicSetDate?: Date,
    topicUser?: User,
    password?: boolean,
    users?: ChannelUser[],
    events?: Event[],
}
