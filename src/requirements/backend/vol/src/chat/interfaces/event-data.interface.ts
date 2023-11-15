import { UserModel as User } from '../models/user.model'
import { EventContent } from '.';

export interface EventData {
    uuid?: string;
    timestamp?: Date;
    modified?: boolean;
    senderUser: User;
    content: EventContent;
};
