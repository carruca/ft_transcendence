import {
  UserModel as User,
  EventModel as Event,
} from '.';

import { 
  EventManager,
} from '../managers';

import { 
  ConversationPayload 
} from '../interfaces';

import { 
  ConversationDTO, 
} from '../dto';

import {
  v4 as uuidv4,
} from 'uuid';

export class ConversationModel {
  private readonly uuid_: string;
  private readonly user1_: User;
  private readonly user2_: User;
  private readonly eventManager_: EventManager;

  constructor(conversationPayload: ConversationPayload) {
    this.uuid_ = conversationPayload.uuid ?? uuidv4();
    this.user1_ = conversationPayload.user1;
    this.user2_ = conversationPayload.user2;
    this.eventManager_ = new EventManager();
  }

  get uuid(): string {
    return this.uuid_;
  }

  get user1(): User {
    return this.user1_;
  }

  get user2(): User {
    return this.user2_;
  }

  public addMessageEvent(sourceUser: User, value: string): Event {
    return this.eventManager_.addEvent(Event.message(sourceUser, value));
  }

  public addEvent(event: Event): Event {
    return this.eventManager_.addEvent(event);
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
    this.eventManager_.deleteEvents();
  }

  getEvent(): Event[] {
    return this.eventManager_.getEvents();
  }

  getEventsAfterUUID(startEventUUID: string): Event[] {
    return this.getEventsAfterUUID(startEventUUID);
  }

  countEventsAfterUUID(startEventUUID: string): number {
    return this.countEventsAfterUUID(startEventUUID);
  }

  get count(): number {
    return this.eventManager_.count;
  }

  hasBlocked(user: User): boolean {
    if (this.user1 !== user)
      return this.user1.hasBlocked(user);
    return this.user2.hasBlocked(user);
  }
}
