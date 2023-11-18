import { EventType } from '../enums';

export interface EventDTO {
  uuid: string;
  eventType: EventType;
  sourceUUID: string;
  targetUUID?: string;
  timestamp: Date;
  modified: boolean;
  value?: string;
};
