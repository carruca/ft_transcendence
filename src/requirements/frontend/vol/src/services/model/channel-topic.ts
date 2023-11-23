import {
    User,
} from './';

export class ChannelTopic {
    constructor(
        public readonly user: User,
        public establishedDate: Date,
        public value: string,
    ) {}
}

