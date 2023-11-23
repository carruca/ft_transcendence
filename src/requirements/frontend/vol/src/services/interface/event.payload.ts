import {
    User,
} from '../model';

import {
    EventTypeEnum,
} from '../enum';

export interface EventPayload {
    uuid: string,
    type: EventTypeEnum,
    sourceUser: User,
    targetUser? User,
    timestamp: Date,
    modified: boolean,
    value?: string,
}
