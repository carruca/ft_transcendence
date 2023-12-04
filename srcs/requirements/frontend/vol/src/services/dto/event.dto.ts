import {
    EventTypeEnum,
} from '../enum';

export interface EventDTO {
    id: string;
    type: EventTypeEnum;
    sourceId: string;
	sourceNickname: string;
    targetId?: string;
	targetNickname?: string;
    timestamp: Date;
    modified: boolean;
    value?: string;
}
