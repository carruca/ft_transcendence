import { UserModel as User } from '../models';
import { EventType } from '../enums';

export interface EventData {
    uuid?: string;
    eventType: EventType;
    timestamp?: Date;
    modified?: boolean;
    sourceUser: User;
    targetUser?: User;
    value?: string;
};
