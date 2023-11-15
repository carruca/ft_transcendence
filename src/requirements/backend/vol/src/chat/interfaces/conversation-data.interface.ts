import { UserModel as User } from '../models/user.model'

export interface ConversationData {
    uuid?: string;
    user1: User;
    user2: User;
}
