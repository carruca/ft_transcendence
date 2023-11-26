import {
  EventTypeEnum,
} from '../event';

import {
  EventPayload,
} from '../interface';

import {
  User,
} from '.';

export class Event {
  public readonly id: string;
  public readonly type: EventTypeEnum;
  public readonly sourceId: string;
  public readonly targetId?: string;
  public readonly sourceNickname: string;
  public readonly targetNickname?: string;
  public value: string;
  public readonly timestamp: Date;
  public edited: boolean;

  constructor (eventPayload: EventPayload) {
    this.id = eventPayload.id;
    this.type = eventPayload.type;
    this.sourceId = eventPayload.sourceId;
    this.targetId = eventPayload.targetId;
    this.sourceNickname = eventPayload.sourceNickname;
    this.targetNickname = eventPayload.targetNickname;
    this.value = eventPayload.value || '';
    this.timestamp = eventPayload.timestamp ? new Date(eventPayload.timestamp) : new Date();
    this.edited = eventPayload.edited;
  }
}
