import {
    EventTypeEnum,
} from '../event';

import {
    User,
} from '.';

export class Event {
    constructor (
        public readonly uuid: string,
        public readonly type: EventTypeEnum,
        public readonly sourceUser: User,
        public readonly targetUser?: User,
        public value: string = '',
        public readonly timestamp = new Date(),
        public edited: boolean = false,
    ) {}
}
