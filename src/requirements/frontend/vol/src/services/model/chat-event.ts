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

export class ChatEvent extends BaseEvent {
  public readonly sourceChannelUser: ChannelUser | undefined;
  public readonly targetChannelUser: ChannelUser | undefined;
  public readonly message: string;
  public readonly color: string;

  private static randomSeed = Math.floor(Math.random() * 1000000);
  private static colors = [
    '#ac2847',
    '#ec273f',
    '#de5d3a',
    '#f3a833',
    '#ce9248',
    '#e8d282',
    '#f7f3b7',
    '#26854c',
    '#5ab552',
    '#9de64e',
    '#62a477',
    '#3388de',
    '#36c5f4',
    '#6dead6',
    '#9a4d76',
    '#c878af',
    '#cc99ff',
    '#fa6e79',
    '#ffa2ac',
    '#ffd1d5',
  ];

  constructor(event: BaseEvent, sourceChannelUser: ChannelUser, targetChannelUser?: ChannelUser) {
    super(event);
    this.message = ChatEvent.formatEventMessage(event);
    this.color = ChatEvent.stringToColor(this.source.name);
    this.sourceChannelUser = sourceChannelUser;
    this.targetChannelUser = targetChannelUser;
  }

  // Public methods

  public isMessageEvent() {
    return this.type === EventTypeEnum.MESSAGE;
  };
  public isTargetEvent() {
    if (this.type === EventTypeEnum.KICK)
      return true;
    if (this.type === EventTypeEnum.BAN)
      return true;
    if (this.type === EventTypeEnum.UNBAN)
      return true;
    if (this.type === EventTypeEnum.MUTE)
      return true;
    if (this.type === EventTypeEnum.UNMUTE)
      return true;
    if (this.type === EventTypeEnum.PROMOTE)
      return true;
    if (this.type === EventTypeEnum.DEMOTE)
      return true;
    return false;
  };

  // Private methods

  private static stringToColor(str) {
    let hash = ChatEvent.randomSeed;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return ChatEvent.colors[(Math.abs(hash) * ChatEvent.randomSeed) % this.colors.length];
  };

  private static formatEventMessage(event) {
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
      case EventTypeEnum.PROMOTE:
        return `has promoted`;
      case EventTypeEnum.DEMOTE:
        return `has demoted`;
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
