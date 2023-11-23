import {
  UserModel as User,
} from '.';

import {
  EventPayload,
} from '../interfaces';

import {
  EventDTO,
} from '../dto';

import {
  EventTypeEnum,
} from '../enums'

import {
  v4 as uuidv4,
} from 'uuid';

export class EventModel {
  private uuid_: string;
  private timestamp_: Date;
  private modified_: boolean;
  private sourceUser_: User;
  private targetUser_: User | undefined;
  private type_: EventTypeEnum;
  private value_: string | undefined;

  constructor(eventPayload: EventPayload) {
    this.uuid_ = eventPayload.uuid ?? uuidv4();
    this.timestamp_ = new Date();
    this.modified_ = eventPayload.modified ?? false;
    this.sourceUser_ = eventPayload.sourceUser;
    this.targetUser_ = eventPayload.targetUser;
    this.type_ = eventPayload.type;
    this.value_ = eventPayload.value;
  }

  public static message(sourceUser: User, value: string): EventModel {
    return new EventModel({
      sourceUser: sourceUser,
      type: EventTypeEnum.MESSAGE,
      value: value,
    });
  }

  public static kick(sourceUser: User, targetUser: User, value?: string): EventModel {
    return new EventModel({
      type: EventTypeEnum.KICK,
      sourceUser: sourceUser,
      targetUser: targetUser,
      value: value,
    });
  }

  public static generic(type: EventTypeEnum, sourceUser: User, targetUser?: User, value?: string): EventModel {
    return new EventModel({
      type: type,
      sourceUser: sourceUser,
      targetUser: targetUser,
      value: value,
    })
  }

  get uuid(): string {
    return this.uuid_;
  }

  get type(): EventTypeEnum {
    return this.type_
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

  get targetUser(): User | undefined {
    return this.targetUser_;
  }

  get value(): string | undefined {
    return this.value_;
  }

  modifyContent(user: User, value: string): boolean {
    const now = new Date();
    const timeDifference = now.getTime() - this.timestamp_.getTime();
    const timeThreshold = 60 * 1000; //1 minute in milliseconds

    if (
         this.sourceUser_ === user
      && timeDifference <= timeThreshold
      && this.type_ === EventTypeEnum.MESSAGE
    ) {
        this.value_ = value;
        this.modified_ = true;
        this.timestamp_ = now;
        return true;
    }
    return false;
  }

  get DTO(): EventDTO {
    return new EventDTO(this);
  }
}
