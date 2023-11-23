import {
  ConversationModel as Conversation,
} from '../model';

export class ConversationDTO {
  uuid: string;
  user1UUID: string
  user2UUID: string;
  
  constructor(conversation: Conversation) {
    this.uuid = conversation.uuid;
    this.user1UUID = conversation.user1.uuid;
    this.user2UUID = conversation.user2.uuid;
  }
};
