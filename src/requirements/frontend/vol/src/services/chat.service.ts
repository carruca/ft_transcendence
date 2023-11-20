import { reactive, ref, readonly, onMounted } from 'vue';
import { Channel, ChannelUser, User, Event } from './models';
import { EventTypeEnum } from './event-type.enum';
import { v4 as uuidv4 } from 'uuid';

class ChatService {
    private channels_ = ref< Map<string, Channel> >(new Map());
    private currentChannelUUID_: string | null = null;

    private users_ = new Map<string, User>();

    private channelList_ = ref<Channel[]>([]);
    public readonly channelList = readonly(this.channelList_);

    private currentChannel_ = ref<Channel | null>(null);
    public readonly currentChannel = readonly(this.currentChannel_);

    public readonly isDarkMode = ref<boolean>(false);


    constructor() {}

    private clear_() {
        for (const channel of this.channels_.value.values()) {
            channel.clear();
        }
        this.channels_.value.clear();
        this.users_.clear();
    }

    public startSimulation() {
        const ownerUser = new User('first-uuid', 'first');
        const user1 = new User('user1-uuid', 'User1');
        const user2 = new User('user2-uuid', 'User2');
        const user3 = new User('user3-uuid', 'User3');
        const channel1 = new Channel("channel1-uuid", "#test", ownerUser);
        const channel2 = new Channel("channel2-uuid", "#wer", ownerUser);

        this.clear_();

        this.channels_.value.set(channel1.uuid, channel1);
        this.channels_.value.set(channel2.uuid, channel2);
        this.users_.set(user1.uuid, user1);
        this.users_.set(user2.uuid, user2);
        this.users_.set(user3.uuid, user3);

        this.currentChannelUUID_ = channel1.uuid;
        //this.currentChannel_.value = channel1;
        this.channelList_.value = this.channels_.value;

        this.addUserToChannel(channel1, user1, {
            isAdmin: true,
        });
        this.addUserToChannel(channel1, user2, {
        });
        this.addUserToChannel(channel2, user3, {
            isAdmin: true,
            isBanned: true,
        });

        this.create(channel1, user1);
        this.join(channel1, user2);
        this.chanmsg(channel1, user2, "Hola tio");
        this.chanmsg(channel1, user1, "Fuera de aquí!");

        setTimeout(() => {
            const channel3 = new Channel("channel3-uuid", "#new_chan", ownerUser);
            this.addChannel_(channel3);
            setTimeout(() => {
                this.ban(channel1, user1, user2);
                setTimeout(() => {
                    this.chanmsg(channel1, user1, "Payaso...");
                }, 1000);
            }, 1000);
        }, 2000);
    }

    private addChannel_(channel: Channel) {
        this.channels_.value.set(channel.uuid, channel);
    }

    private delChannel_(channel: Channel) {
        channel.clear();
        this.channels_.value.delete(channel.uuid);
    }

    public create(channelName: string, ownerUser: User, password?: string) {
        const channel = Channel(uuid(), channelName, ownerUser, password);

        channel.addEvent(new Event(
                uuidv4(),
                EventTypeEnum.CREATE,
                ownerUser,
        ));
        this.addChannel_(channel);
    }

    public close(channel: Channel, sourceUser: User) {
        channel.addEvent(new Event(
                uuidv4(),
                EventTypeEnum.CLOSE,
                sourceUser,
        ));
        this.delChannel_(channel);
    }

    public ban(channel: Channel, sourceUser: User, targetUser: User) {
        channel.addEvent(new Event(
                uuidv4(),
                EventTypeEnum.BAN,
                sourceUser,
                targetUser,
        ));
        targetUser.isBanned = true;
    }

    public unban(channel: Channel, sourceUser: User, targetUser: User) {
        channel.addEvent(new Event(
                uuidv4(),
                EventTypeEnum.UNBAN,
                sourceUser,
                targetUser,
        ));
        targetUser.isBanned = false;
    }

    public mute(channel: Channel, sourceUser: User, targetUser: User) {
        channel.addEvent(new Event(
                uuidv4();
                EventTypeEnum.MUTE,
                sourceUser,
                targetUser,
        ));
        targetUser.isMuted = true;
    }

    public unmute(channel: Channel, sourceUser: User, targetUser: User) {
        channel.addEvent(new Event(
                uuidv4();
                EventTypeEnum.UNMUTE,
                sourceUser,
                targetUser,
        ));
        targetUser.isMuted = false;
    }

    public kick(channel: Channel, sourceUser: User, targetUser: User) {
        channel.addEvent(new Event(
                uuidv4(),
                EventTypeEnum.KICK,
                sourceUser,
                targetUser,
        ));
        this.delUserFromChannel(channel, targetUser);
    }

    public join(channel: Channel, sourceUser: User) {
        channel.addEvent(new Event(
                uuidv4(),
                EventTypeEnum.JOIN,
                sourceUser,
        )); 
        this.addUserToChannel(channel, sourceUser, { isAdmin: (channel.users.size === 0), isBanned: false, isMute: false });
    }

    public part(channel: Channel, sourceUser: User) {
        channel.addEvent(new Event(
                uuidv4(),
                EventTypeEnum.PART,
                sourceUser,
        ));
        this.delUserFromChannel(channel, sourceUser);
    }

    public chanmsg(channel: Channel, sourceUser: User, message: string) {
        channel.addEvent(new Event(
                uuidv4();
                EventTypeEnum.MESSAGE,
                sourceUser,
                undefined,
                message,
        ));
    }

    public privmsg(targetUser: User, sourceUser: User, message: string) {
        targetUser.addEvent(new Event(
                uuidv4();
                EventTypeEnum.MESSAGE,
                sourceUser,
                targetUser,
                message,
        ));
    }

    public setCurrentChannel = (channelUUID: string): void => {
        if (this.channels_.value.has(channelUUID)) {
            this.currentChannelUUID_ = channelUUID;
            this.currentChannel_.value = this.channels_.value.get(channelUUID) || undefined;
        }
    }

    public addUserToChannel(channel: Channel, user: User, props: ChannelUserProperties) {
        const newChannelUser = new ChannelUser(user, props);
        channel.users.set(user.uuid, newChannelUser);
    }

    public delUserFromChannel(channel: Channel, user: User) {
        channel.users.delete(user.uuid);
    }
}

export const chatService = new ChatService();
