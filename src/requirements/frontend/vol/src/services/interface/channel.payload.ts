import {
    Event,
    ChannelUser,
    ChannelTopic,
} from '../model';

export interface ChannelPayload {
    uuid: string,
    name: string,
    creationDate: Date,
    ownerUser: User,
    topic: ChannelTopic,
    hasPassword?: string,
    users: ChannelUser[],
    events: Event[],
}
