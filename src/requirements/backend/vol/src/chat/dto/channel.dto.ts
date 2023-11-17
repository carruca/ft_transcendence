import { ChannelModel as Channel } from '../models';
import { ChannelUserDTO } from '../dto';
import { ChannelTopicDTO } from '.';

export class ChannelDTO {
    readonly uuid: string;
    readonly name: string;
    readonly createdDate: Date;
    readonly ownerUUID: string;
    readonly topic?: ChannelTopicDTO;
    readonly hasPassword: boolean;
    readonly users: ChannelUserDTO[];
    
    constructor (channel: Channel) {
        this.uuid = channel.uuid;
        this.name = channel.name;
        this.createdDate = channel.createdDate;
        this.ownerUUID = channel.owner.uuid;
        this.topic = channel.topic && channel.topic.value !== "" ? new ChannelTopicDTO(channel.topic) : undefined;
        this.hasPassword = channel.password?.length != 0 ?? false;
        this.users = channel.getUsers().map((user) => new ChannelUserDTO(channel, user));
    }
}
