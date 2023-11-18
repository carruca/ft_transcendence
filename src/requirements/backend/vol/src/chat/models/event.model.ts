import { UserModel as User } from '.';

import { EventData } from '../interfaces';

import { EventDTO } from '../dto';

import { EventType } from '../enums'

import { v4 as uuidv4 } from 'uuid';

export { EventData, EventDTO, EventType }

export class EventModel {
  private uuid_: string;
  private timestamp_: Date;
  private modified_: boolean;
  private sourceUser_: User;
  private targetUser_: User | undefined;
  private eventType_: EventType;
  private value_: string | undefined;

  constructor(eventData: EventData) {
    this.uuid_ = eventData.uuid ?? uuidv4();
    this.timestamp_ = new Date();
    this.modified_ = eventData.modified ?? false;
    this.sourceUser_ = eventData.sourceUser;
    this.targetUser_ = eventData.targetUser;
    this.eventType_ = eventData.eventType;
    this.value_ = eventData.value;
  }

  public static message(sourceUser: User, value: string): EventModel {
    return new EventModel({
      sourceUser: sourceUser,
      eventType: EventType.MESSAGE,
      value: value,
    });
  }

  public static kick(sourceUser: User, targetUser: User, value?: string): EventModel {
    return new EventModel({
      eventType: EventType.KICK,
      sourceUser: sourceUser,
      targetUser: targetUser,
      value: value,
    });
  }

  public static generic(eventType: EventType, sourceUser: User, targetUser?: User, value?: string): EventModel {
    return new EventModel({
      eventType: eventType,
      sourceUser: sourceUser,
      targetUser: targetUser,
      value: value,
    })
  }

  get uuid(): string {
    return this.uuid_;
  }

  get timestamp(): Date {
    return this.timestamp_;
  }

  get modified(): boolean {
    return this.modified_;
  }

  get sourceUser(): User {
    return this.sourceUser_;
  }

  modifyontent(user: User, value: string): boolean {
    const now = new Date();
    const timeDifference = now.getTime() - this.timestamp_.getTime();
    const timeThreshold = 60 * 1000; //1 minute in milliseconds

    if (
         this.sourceUser_ === user
      && timeDifference <= timeThreshold
      && this.eventType_ === EventType.MESSAGE
    ) {
        this.value_ = value;
        this.modified_ = true;
        this.timestamp_ = now;
        return true;
    }
    return false;
  }

  getDTO(): EventDTO {
    return {
      uuid: this.uuid_,
      eventType: this.eventType_,
      timestamp: this.timestamp_,
      modified: this.modified_,
      sourceUUID: this.sourceUser_.uuid,
      targetUUID: this.targetUser_?.uuid,
      value: this.value_,
    };
  }
}
