import {
  EventTypeEnum,
} from '../enum';

import {
  EventPayload,
} from '../interface';

import {
  EventUser,
} from '.';

export class Event {
  public readonly id: string;
  public readonly type: EventTypeEnum;
  public readonly source: EventUser;
  public readonly target?: EventUser;
  public value: string;
  public readonly timestamp: Date;
  public modified: boolean;

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
      this.modified = eventPayloadOrEvent.modified;
    } else {
      // Original constructor implementation
      this.id = eventPayloadOrEvent.id;
      this.type = eventPayloadOrEvent.type;
      this.source = new EventUser(eventPayloadOrEvent.sourceId, eventPayloadOrEvent.sourceNickname);
      this.target = eventPayloadOrEvent.targetId ? new EventUser(eventPayloadOrEvent.targetId, eventPayloadOrEvent.targetNickname!) : undefined;
      this.value = eventPayloadOrEvent.value || '';
      this.timestamp = eventPayloadOrEvent.timestamp ? new Date(eventPayloadOrEvent.timestamp) : new Date();
      this.modified = eventPayloadOrEvent.modified;
    }
  }
}
