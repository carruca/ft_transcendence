import {
    NotifyEventTypeEnum,
} from '../enum';

export interface NotifyEvent {
    notify(object: any, type: NotifyEventTypeEnum, changes: {}): void;
}
