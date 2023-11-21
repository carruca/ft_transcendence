import {
  ConversationModel as Conversation,
} from '../models';

export class ConversationDTO {
  public readonly uuid: string;
  public readonly user1UUID: string
  public readonly user2UUID: string;
  
  constructor(conversation: Conversation) {
    this.uuid = conversation.uuid;
    this.user1UUID = conversation.user1.uuid;
    this.user2UUID = conversation.user2.uuid;
  }
};
