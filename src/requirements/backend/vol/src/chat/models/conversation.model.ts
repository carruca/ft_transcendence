import { UserModel as User, EventModel as Event } from '.'
import { EventManager } from '../managers'
import { ConversationData, ConversationDetails } from '../interfaces'

export { ConversationData, ConversationDetails };

export class ConversationModel {
    private uuid_: string;
    private user1_: User;
    private user2_: User;
    private eventManager_: EventManager;

    constructor(conversationData: ConversationData) {
        if (conversationData.uuid)
            this.uuid_ = conversationData.uuid;
        this.user1_ = conversationData.user1;
        this.user2_ = conversationData.user2;
        this.eventManager_ = new EventManager();
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

    public addMessageEvent(sourceUser: User, value: string): Event {
        return this.eventManager_.addEvent(Event.message(sourceUser, value));
    }

    public addEvent(event: Event): Event {
        return this.eventManager_.addEvent(event);
    }

    public getUsers(): User[] {
        return [this.user1_, this.user2_];
    }

    public getUsersExcept(user: User): User[] {
        if (this.user1_ !== user)
            return [this.user1_];
        return [this.user2_];
    }

    deleteEvents(): void {
        this.eventManager_.deleteEvents();
    }

    getEvent(): Event[] {
        return this.eventManager_.getEvents();
    }

    getEventsAfterUUID(startEventUUID: string): Event[] {
        return this.getEventsAfterUUID(startEventUUID);
    }

    countEventsAfterUUID(startEventUUID: string): number {
        return this.countEventsAfterUUID(startEventUUID);
    }

    getDetails(): ConversationDetails {
        return {
            uuid: this.uuid_,
            user1UUID: this.user1_.uuid,
            user2UUID: this.user2_.uuid,
        }
    }

    get count(): number {
        return this.eventManager_.count;
    }

    hasBlocked(user: User): boolean {
        if (this.user1 !== user)
            return this.user1.hasBlocked(user);
        return this.user2.hasBlocked(user);
    }
}
