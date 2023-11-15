import { UserModel as User } from '.';
import { EventData, EventDetails, EventContent } from '../interfaces';
import { EventContentType } from '../enums'

import { v4 as uuidv4 } from 'uuid';

export { EventData, EventDetails, EventContent, EventContentType }

export class EventModel {
    private uuid_: string;
    private timestamp_: Date;
    private modified_: boolean;
    private senderUser_: User;
    private content_: EventContent;

    constructor(data: EventData) {
        if (data.uuid === undefined)
            data.uuid = uuidv4();
        this.uuid_ = data.uuid;
        if (data.timestamp === undefined)
            data.timestamp = new Date();
        this.timestamp_ = new Date(data.timestamp);
        if (data.modified === undefined)
            data.modified = false;
        this.modified_ = data.modified;
        this.senderUser_ = data.senderUser;
        this.content_ = data.content;
    }

    public static message(senderUser: User, value: string): EventModel {
        return new EventModel({
            senderUser: senderUser,
            content: {
                type: EventContentType.MESSAGE,
                value: value,
            },
        });
    }

    public static kick(senderUser: User, targetUser: User, value?: string): EventModel {
        return new EventModel({
            senderUser: senderUser,
            content: {
                type: EventContentType.KICK,
                targetUUID: targetUser.uuid,
                value: value,
            },
        });
    }

    public static generic(eventContentType: EventContentType, senderUser: User, targetUser?: User, value?: string): EventModel {
        return new EventModel({
            senderUser: senderUser,
            content: {
                type: eventContentType,
                targetUUID: targetUser?.uuid,
                value: value,
            },
        })
    }

    get uuid(): string {
        return this.uuid_;
    }

    get timestamp(): Date {
        return this.timestamp_;
    }

    get modified(): boolean {
        return this.modified_;
    }

    get senderUser(): User {
        return this.senderUser_;
    }

    get content(): EventContent {
        return this.content_;
    }

    modifyontent(user: User, value: string): boolean {
        const now = new Date();
        const timeDifference = now.getTime() - this.timestamp_.getTime();
        const timeThreshold = 60 * 1000; //1 minute in milliseconds

        if (
               this.senderUser_ === user
            && timeDifference <= timeThreshold
            && this.content_.type === EventContentType.MESSAGE
        ) {
            this.content_.value = value;
            this.modified_ = true;
            this.timestamp_ = now;
            return true;
        }
        return false;
    }

    getDetails(): EventDetails {
        return {
            uuid: this.uuid_,
            timestamp: this.timestamp_,
            modified: this.modified_ ? this.modified_ : undefined,
            senderUUID: this.senderUser_.uuid,
            content: this.content_,
        };
    }
}
