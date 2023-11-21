import {
  UserModel as User,
} from '../models';

import {
  EventTypeEnum,
} from '../enums';

export interface EventPayload {
  uuid?: string;
  type: EventTypeEnum;
  timestamp?: Date;
  modified?: boolean;
  sourceUser: User;
  targetUser?: User;
  value?: string;
};
