import {
  User,
} from '.';

import {
  EventPayload,
} from '../interface';

import {
  EventDTO,
} from '../dto';

import {
  NotifyEventTypeEnum,
  EventTypeEnum,
} from '../enum'

import {
  v4 as uuidv4,
} from 'uuid';

import {
  PropertyUndefinedError,
} from '../error';

export class Event {
  private readonly id_: string;
  private timestamp_: Date;
  private modified_: boolean;
  private readonly sourceUser_: User;
  private readonly targetUser_: User | undefined;
  private readonly type_: EventTypeEnum;
  private value_: string | undefined;
  private notifyCallback_: Function;

  constructor(notifyCallback: Function, eventPayload: EventPayload) {
    this.id_ = eventPayload.uuid || uuidv4();
    this.timestamp_ = eventPayload.timestamp || new Date();
    this.modified_ = eventPayload.modified || false;
	  if (!eventPayload.sourceUser)
		  throw new PropertyUndefinedError('Source user is undefined');
      this.sourceUser_ = eventPayload.sourceUser;
	  if (!eventPayload.type)
		  throw new PropertyUndefinedError('Type is undefined');
	  if (!eventPayload.targetUser && (
	      eventPayload.type == EventTypeEnum.KICK ||
	      eventPayload.type == EventTypeEnum.BAN  ||
	      eventPayload.type == EventTypeEnum.UNBAN ||
	      eventPayload.type == EventTypeEnum.PROMOTE ||
	      eventPayload.type == EventTypeEnum.DEMOTE ||
	      eventPayload.type == EventTypeEnum.MUTE ||
	      eventPayload.type == EventTypeEnum.UNMUTE
	  )) {
	  	throw new PropertyUndefinedError('Target user is undefined');
	  }
    this.targetUser_ = eventPayload.targetUser;
    this.type_ = eventPayload.type;
    this.value_ = eventPayload.value;
    this.notifyCallback_ = notifyCallback;
  }

  private notify_(type: NotifyEventTypeEnum, changes?: {}) {
    this.notifyCallback_( [ this ], type, changes);
  }

  get id(): string {
    return this.id_;
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

  updateContent(user: User, value: string): boolean {
    const now = new Date();
    const differenceTime = now.getTime() - this.timestamp_.getTime();
    const thresholTime = 60 * 1000; //1 minute in milliseconds

    if (
         this.sourceUser_ === user
      && differenceTime <= thresholTime
      && this.type_ === EventTypeEnum.MESSAGE
    ) {
      this.value_ = value;
      this.modified_ = true;
      this.timestamp_ = now;
      this.notify_(NotifyEventTypeEnum.UPDATE, {
        value : value,
        modified : true,
        timestamp : this.timestamp_,
      });
      return true;
    }
    return false;
  }

  DTO(): EventDTO {
    return new EventDTO(this);
  }
}
