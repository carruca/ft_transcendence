import { Socket } from 'socket.io';
import { UserStatus, UserSiteRole } from '../enums'

export interface UserData {
    id: number;
    uuid: string;
    name: string;
    status?: UserStatus;
    socket?: Socket;
    siteRole?: UserSiteRole;
    banned?: boolean;
    disabled?: boolean;
}
