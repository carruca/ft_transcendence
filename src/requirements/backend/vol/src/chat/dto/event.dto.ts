import {
  EventTypeEnum,
} from '../enum';

import {
  EventModel as Event,
} from '../model';

export class EventDTO {
  uuid: string;
  type: EventTypeEnum;
  sourceUUID: string;
  targetUUID?: string;
  timestamp: Date;
  modified: boolean;
  value?: string;

  constructor(event: Event) {
    this.uuid = event.uuid;
    this.type = event.type;
    this.timestamp = event.timestamp;
    this.modified = event.modified;
    this.sourceUUID = event.sourceUser.uuid;
    this.targetUUID = event.targetUser?.uuid;
    this.value = event.value;
  }
};
