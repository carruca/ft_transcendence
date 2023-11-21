import {
  EventTypeEnum,
} from '../enums';

import {
  EventModel as Event,
} from '../models';

export class EventDTO {
  public readonly uuid: string;
  public readonly type: EventTypeEnum;
  public readonly sourceUUID: string;
  public readonly targetUUID?: string;
  public readonly timestamp: Date;
  public readonly modified: boolean;
  public readonly value?: string;

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
