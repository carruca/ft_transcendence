import { User } from './user';
import type { ConversationDetails } from './conversationdetails';

export class Conversation {
    private uuid_: string;
    private user1_: User;
    private user2_: User;
    private messages_: string[];

    constructor(data: ConversationDetails) {
        this.uuid_ = data.uuid;
        this.user1_ = data.user1;
        this.user2_ = data.user2;
        this.messages_ = data.messages;
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
}
