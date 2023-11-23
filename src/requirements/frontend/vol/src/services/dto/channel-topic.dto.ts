import {
    UserDTO,
} from '.';

export interface ChannelTopicDTO {
    userDTO: UserDTO,
    establishedDate: Date,
    value: string,
}
