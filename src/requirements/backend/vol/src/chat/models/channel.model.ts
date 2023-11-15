import { UserModel as User, EventModel as Event } from '.';
import { EventManager } from '../managers';
import { UserDetails, ChannelData, ChannelDetails, ChannelTopic } from '../interfaces';
import { EventContentType } from '../enums';
import { PropertyUndefinedError, NotImplementedError } from '../errors';

export { ChannelData, ChannelTopic, ChannelDetails };

export class ChannelModel {
    private uuid_: string;
    private name_: string;
    private owner_?: User;
    private topic_?: ChannelTopic;
    private password_?: string;
    private users_ = new Map<string, User>;
    private bans_ = new Set<string>;
    private mutes_ = new Set<string>;
    private opers_ = new Set<string>;
    private eventManager_ = new EventManager;

    public constructor(data: ChannelData) {
        this.uuid_ = data.uuid;
        this.name_ = data.name;
        this.owner_ = data.owner;
        this.topic_ = data.topic;
        this.password_ = data.password;
    }

    public addMessageEvent(sourceUser: User, value: string): Event {
        return this.eventManager_.addEvent(Event.message(sourceUser, value));
    }

    public addEvent(event: Event): Event {
        return this.eventManager_.addEvent(event);
    }

    public addGenericEvent(eventContentType: EventContentType, sourceUser: User, targetUser?: User): Event {
        return this.eventManager_.addEvent(Event.generic(eventContentType, sourceUser, targetUser));
    }

    public addKickEvent(sourceUser: User, targetUser: User, value?: string): Event {
        return this.eventManager_.addEvent(Event.kick(sourceUser, targetUser, value));
    }

    public hasUser(user: User): boolean {
        return this.users_.has(user.uuid);
    }

    public addUser(user: User): boolean {
        // Lógica para agregar un usuario al canal
        if (!this.hasUser(user)) {
            this.users_.set(user.uuid, user);
            return true;
        }
        return false;
    }

    public removeUser(user: User) {
        // Lógica para eliminar un usuario del canal
        this.users_.delete(user.uuid);
        this.opers_.delete(user.uuid);
    }

    public addBan(user: User): boolean {
        if (!this.hasBanned(user)) {
            this.bans_.add(user.uuid);
            return true;
        }
        return false;
    }

    public hasBanned(user: User): boolean {
        return this.bans_.has(user.uuid);
    }

    public removeBan(user: User): void {
        this.bans_.delete(user.uuid);
    }

    public addMute(user: User): boolean {
        if (!this.hasMuted(user)) {
            this.mutes_.add(user.uuid);
            return true;
        }
        return false;
    }

    public hasMuted(user: User): boolean {
        return this.mutes_.has(user.uuid);
    }

    public removeMute(user: User): void {
        this.mutes_.delete(user.uuid);
    }

    public addOper(user: User): boolean {
        if (!this.hasOper(user)) {
            this.opers_.add(user.uuid);
            return true;
        }
        return false;
    }

    public hasOper(user: User): boolean {
        return this.opers_.has(user.uuid);
    }

    public removeOper(user: User): void {
        this.opers_.delete(user.uuid);
    }

    public hasPrivileges(user: User): boolean {
        return this.isOwner(user) || this.hasOper(user);
    }

    public isOwner(user: User): boolean {
        return this.owner == user;
    }

    public getUsers(): User[] {
        return Array.from(this.users_.values());
    }

    public getUsersExcept(exceptUser: User): User[] {
        return this.getUsers().filter((user: User) => user.uuid !== exceptUser.uuid );
    }

    public getDetails(): ChannelDetails {
        return {
            uuid: this.uuid_,
            name: this.name_,
          //owner: this.owner_.getDetails(),
     //     successor: this.successor_.getDetails(),
            topic: this.topic_,
            hasPassword: (this.password_ !== undefined),
        }
    }

    //properties
    get isEmpty(): boolean {
        return this.users_.size === 0;
    }

    getUsersCount(): number {
        return this.users_.size;
    }

    get uuid(): string {
        return this.uuid_;
    }

    get name(): string {
        return this.name_;
    }

    get owner(): User | undefined {
        return this.owner_;
    }
/*
    set successor(user: User | undefined) {
        this.successor_ = user;
    }

    get successor(): User | undefined {
        return this.successor_;
    }
*/
    set topic(value: ChannelTopic | undefined) {
        this.topic_ = value;
    }

    get topic(): ChannelTopic | undefined {
        return this.topic_;
    }

    set password(value: string | undefined) {
        this.password_ = value;
    }

    get password(): string | undefined {
        return this.password_;
    }
}
