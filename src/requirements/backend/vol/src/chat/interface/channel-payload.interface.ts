import {
    User,
} from '../model';

import {
} from '.';

export interface ChannelPayload {
    id?: string;
    name?: string;
    owner?: User;
    createdDate?: Date;
    topic?: string;
    topicSetDate?: Date;
    topicUser?: User;
    password?: string;
}
