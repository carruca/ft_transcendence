import { EventContentType } from '../enums'

export interface EventContent {
    type: EventContentType;
    targetUUID?: string;
    value?: string;
};
