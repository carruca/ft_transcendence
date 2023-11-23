import {
    UserDTO,
    EventDTO,
    ChannelUserDTO,
    ChannelTopicDTO,
} from '../dto';

export interface ChannelDTO {
    uuid: string;
    name: string;
    creationDate: Date;
    ownerUserDTO: UserDTO;
    topic: ChannelTopicDTO;
    hasPassword: boolean;
    users: ChannelUserDTO[];
    events: EventDTO[];
}
