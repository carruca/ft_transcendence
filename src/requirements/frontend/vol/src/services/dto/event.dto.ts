import {
    EventTypeEnum,
} from '../enum';

export interface EventDTO {
    uuid: string,
    type: EventTypeEnum,
    sourceUUID: string,
    targetUUID?: string,
    timestamp: Date;
    modified: boolean,
    value?: string,
}
