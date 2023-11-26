import {
    UserDTO,
    EventDTO,
    ChannelUserDTO,
    ChannelTopicDTO,
} from '../dto';

export interface ChannelDTO {
    id: string;
    name: string;
    createdDate: Date;
    ownerDTO: UserDTO;
    topic: string;
    topicSetDate: Date;
    topicUserDTO: UserDTO; 
    password: boolean;
    channelUsersDTO: ChannelUserDTO[];
    eventsDTO: EventDTO[];
}
