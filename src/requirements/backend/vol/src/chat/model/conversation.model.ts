import {
  User,
  Event,
} from '.';

import {
  RollingLogger,
} from '../util';

import { 
  EventPayload,
  ConversationPayload 
} from '../interface';

import { 
  ConversationDTO, 
} from '../dto';

import {
  NotifyEventTypeEnum,
  EventTypeEnum,
} from '../enum';

import {
  v4 as uuidv4,
} from 'uuid';

const EVENTS_MAX = 100;

export class Conversation {
  private readonly id_: string;
  private readonly user1_: User;
  private readonly user2_: User;

  private readonly events_: RollingLogger<Event>;
  private readonly notifyCallback_: Function;

  constructor(notifyCallback: Function, conversationPayload: ConversationPayload) {
    this.id_ = conversationPayload.id ?? uuidv4();
    this.user1_ = conversationPayload.user1;
    this.user2_ = conversationPayload.user2;
    this.events_ = new RollingLogger<Event>(EVENTS_MAX);
    this.notifyCallback_ = notifyCallback;
    this.notify_(EventTypeEnum.CREATE);
  }

  private notify_(type: EventTypeEnum, changes?: {}) {
    this.notifyCallback_(this, type, changes);
  }

  private childNotify_(objects: any[], type: NotifyEventTypeEnum, changes?: {}) {
    this.notifyCallback_( [ ...objects, this ], type, changes);
  }

  public createEvent(eventPayload: EventPayload): Event {
    const event = new Event(this.childNotify_.bind(this), eventPayload);

    this.events_.add(event);
    this.childNotify_([ event ], NotifyEventTypeEnum.CREATE);
    return event;
  }

  public createEventMessage(sourceUser: User, value: string): Event {
    return this.createEvent({
      type: EventTypeEnum.MESSAGE,
      sourceUser: sourceUser,
    });
  }

  get id(): string {
    return this.id_;
  }

  get user1(): User {
    return this.user1_;
  }

  get user2(): User {
    return this.user2_;
  }

  public getUsers(): User[] {
    return [this.user1_, this.user2_];
  }

  public getUsersExcept(user: User): User[] {
    if (this.user1_ !== user)
      return [this.user1_];
    return [this.user2_];
  }

  deleteEvents(): void {
    this.events_.clear();
  }

  getEvent(): Event[] {
    return this.events_.values();
  }

  getEventsAfterUUID(startEventUUID: string): Event[] {
    return this.getEventsAfterUUID(startEventUUID);
  }

  countEventsAfterUUID(startEventUUID: string): number {
    return this.countEventsAfterUUID(startEventUUID);
  }

  get count(): number {
    return this.events_.size;
  }

  hasBlocked(user: User): boolean {
    if (this.user1 !== user)
      return this.user1.hasBlocked(user);
    return this.user2.hasBlocked(user);
  }
}
