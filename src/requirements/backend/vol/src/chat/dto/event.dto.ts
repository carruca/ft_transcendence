import {
  EventTypeEnum,
} from '../enum';

import {
  Event,
} from '../model';

export class EventDTO {
  id: string;
  type: EventTypeEnum;
  sourceId: string;
  targetId?: string;
  sourceNickname: string;
  targetNickname?: string;
  timestamp: Date;
  modified: boolean;
  value?: string;

  constructor(event: Event) {
    this.id = event.id;
    this.type = event.type;
    this.timestamp = event.timestamp;
    this.modified = event.modified;
    this.sourceId = event.sourceUser.id;
    this.targetId = event.targetUser?.id;
    this.sourceNickname = event.sourceUser.nickname;
    this.targetNickname = event.targetUser?.nickname;
    this.value = event.value;
  }
};
