import {
    User,
} from '../model';

import {
    EventTypeEnum,
} from '../enum';

export interface EventPayload {
    id: string,
    type: EventTypeEnum,
    sourceId: string,
    targetId?: string,
    sourceNickname: string,
    targetNickname?: string,
    timestamp: Date,
    modified: boolean,
    value?: string,
}
