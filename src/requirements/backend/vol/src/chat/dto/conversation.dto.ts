import {
  Conversation,
} from '../model';

export class ConversationDTO {
  id: string;
  user1id: string
  user2id: string;
  
  constructor(conversation: Conversation) {
    this.id = conversation.id;
    this.user1id = conversation.user1.id;
    this.user2id = conversation.user2.id;
  }
};
