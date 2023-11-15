import { EventContent } from '.'

export interface EventDetails {
    uuid: string;
    timestamp: Date;
    modified?: boolean;
    senderUUID: string;
    content: EventContent;
};
