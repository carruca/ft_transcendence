import {
  EventTypeEnum,
} from '../event';

import {
  EventPayload,
} from '../interface';

import {
  User,
} from '.';

export class EventUser {
  public readonly id?: string;
  public readonly name?: string;

  constructor (id?: string, name?: string) {
    this.id = id;
    this.name = name;
  }
}

export class Event {
  public readonly id: string;
  public readonly type: EventTypeEnum;
  public readonly source: EventUser;
  public readonly target?: EventUser;
  public value: string;
  public readonly timestamp: Date;
  public edited: boolean;

  // Original constructor
  constructor(eventPayload: EventPayload);
  // Copy constructor
  constructor(event: Event);
  // Combined constructor
  constructor(eventPayloadOrEvent: EventPayload | Event) {
    if (eventPayloadOrEvent instanceof Event) {
      // Copy constructor implementation
      this.id = eventPayloadOrEvent.id;
      this.type = eventPayloadOrEvent.type;
      this.source = new EventUser(eventPayloadOrEvent.source.id, eventPayloadOrEvent.source.name);
      this.target = eventPayloadOrEvent.target ? new EventUser(eventPayloadOrEvent.target.id, eventPayloadOrEvent.target.name) : undefined;
      this.value = eventPayloadOrEvent.value;
      this.timestamp = new Date(eventPayloadOrEvent.timestamp);
      this.edited = eventPayloadOrEvent.edited;
    } else {
      // Original constructor implementation
      this.id = eventPayloadOrEvent.id;
      this.type = eventPayloadOrEvent.type;
      this.source = new EventUser(eventPayloadOrEvent.sourceId, eventPayloadOrEvent.sourceNickname);
      this.target = eventPayloadOrEvent.targetId ? new EventUser(eventPayloadOrEvent.targetId, eventPayloadOrEvent.targetNickname) : undefined;
      this.value = eventPayloadOrEvent.value || '';
      this.timestamp = eventPayloadOrEvent.timestamp ? new Date(eventPayloadOrEvent.timestamp) : new Date();
      this.edited = eventPayloadOrEvent.edited;
    }
  }
}
