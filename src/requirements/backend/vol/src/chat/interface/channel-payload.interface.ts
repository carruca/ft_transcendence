import {
    UserModel as User,
} from '../model';

import {
    ChannelTopicPayload,
} from '.';

export interface ChannelPayload {
    uuid: string;
    name: string;
    ownerUser: User;
    creationDate: Date;
    topic?: ChannelTopicPayload;
    password?: string;
}
