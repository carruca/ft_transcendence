import {
  User,
} from '../model';

import {
  EventTypeEnum,
} from '../enum';

export interface EventPayload {
  id?: string;
  type: EventTypeEnum;
  timestamp?: Date;
  modified?: boolean;
  sourceUser: User;
  targetUser?: User;
  value?: string;
};
