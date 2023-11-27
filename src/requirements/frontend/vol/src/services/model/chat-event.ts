import {
    User,
    ChannelUser,
    EventUser,
    Event as BaseEvent,
} from '.';

import {
    EventTypeEnum,
} from '../enum';

import {
  EventPayload,
} from '../interface';

import {
    readonly,
    reactive,
} from 'vue';

// TODO instead of reinventing the wheel, just make it contain a 'Event' object
export class ChatEvent extends BaseEvent {
  message: string;

  constructor(event: BaseEvent, message: string) {
    super(event);
    this.message = this.formatEventMessage(event);
  }

  private formatEventMessage(event) {
    let message ='';
    switch (event.type) {
      case EventTypeEnum.MESSAGE:
        return `${event.value}`;
      case EventTypeEnum.PART:
        return `has left`;
      case EventTypeEnum.KICK:
        return `has kicked`;
      case EventTypeEnum.BAN:
        return `has banned`;
      case EventTypeEnum.UNBAN:
        return `has unbanned`;
      case EventTypeEnum.MUTE:
        return `has muted`;
      case EventTypeEnum.UNMUTE:
        return `has unmuted`;
      case EventTypeEnum.PASSWORD:
        if (event.value === undefined)
          return `unset a password`;
        return `set a password`;
      case EventTypeEnum.CREATE:
        return `created the channel`;
      case EventTypeEnum.CLOSE:
        return `closed the channel`;
      case EventTypeEnum.JOIN:
        return `has joined.`
      case EventTypeEnum.TOPIC:
        return `has changed topic to '${event.value}'`;
    }
    return '';
  }
};
