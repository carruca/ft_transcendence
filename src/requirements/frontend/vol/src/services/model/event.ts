import {
  EventTypeEnum,
} from '../event';

import {
  EventPayload,
} from '../interface';

import {
  User,
} from '.';

interface EventUser {
  id: string,
  nick: string,
}

export class Event {
  public readonly id: string;
  public readonly type: EventTypeEnum;
  public readonly source: EventUser;
  public readonly target?: EventUser;
  public value: string;
  public readonly timestamp: Date;
  public edited: boolean;

  constructor (eventPayload: EventPayload) {
    this.id = eventPayload.id;
    this.type = eventPayload.type;
    this.source.id = eventPayload.sourceId;
    this.target.id = eventPayload.targetId;
    this.source.name = eventPayload.sourceNickname;
    this.target.name = eventPayload.targetNickname;
    this.value = eventPayload.value || '';
    this.timestamp = eventPayload.timestamp ? new Date(eventPayload.timestamp) : new Date();
    this.edited = eventPayload.edited;
  }
}
