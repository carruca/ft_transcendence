import {
  UserModel as User,
} from '../model';

import {
  EventTypeEnum,
} from '../enum';

export interface EventPayload {
  uuid?: string;
  type: EventTypeEnum;
  timestamp?: Date;
  modified?: boolean;
  sourceUser: User;
  targetUser?: User;
  value?: string;
};
