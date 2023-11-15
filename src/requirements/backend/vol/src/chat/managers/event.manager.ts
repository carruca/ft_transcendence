import { EventModel as Event } from '../models'
import { EventContentType } from '../enums'

export { EventContentType }

export class EventManager {
    private events_: Event[] = [];

    addEvent(event: Event): Event {
        this.events_.push(event);

        if (this.events_.length > 100)
            this.events_.shift();
        return event;
    }

    getEvents(): Event[] {
        return this.events_;
    }

    getEventsAfterUUID(startingEventUUID: string): Event[] {
        const startIndex = this.findIndexByUUID_(startingEventUUID);

        if (startIndex === -1)
            return this.events_;
        return this.events_.slice(startIndex);
    }

    countEventsAfterUUID(startingEventUUID: string): number  {
        const startIndex = this.findIndexByUUID_(startingEventUUID);

        if (startIndex == -1)
            return 0;
        return this.events_.length - startIndex - 1;
    }

    deleteEvents(): void {
        this.events_ = [];
    }

    get count(): number {
        return this.events_.length;
    }

    private findIndexByUUID_(eventUUID: string): number {
        return this.events_.findIndex((event) => event.uuid === eventUUID);
    }
}
