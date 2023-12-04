import {
    User,
    Channel,
} from '../model';

export interface ChannelUserPayload {
    id: string;
    active: boolean;
    admin: boolean;
    banned: boolean;
    muted: boolean;
    user: User;
    channel: Channel;
}
