import { ChatManager } from './managers';
import { ChatManagerHandler, ChatManagerInstance, ChatManagerSubscribe } from './decorators';

import { ChannelsService } from '../channels/channels.service';
import { UsersService } from '../users/users.service';

import { DataLoaderModel as DataLoader } from './models';

import { Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@ChatManagerHandler()
export class ChatDatabase {
  private readonly logger_: Logger = new Logger("ChatDatabase");

  @ChatManagerInstance()
  private chat_: ChatManager;

  constructor(
    chat: ChatManager,
    private readonly channelsService_: ChannelsService,
    private readonly userService_: UsersService,
  ) {
    this.chat_ = chat;
    this.logger_.log("Instance created");
  }

  /*
  ** ChatService events handle
  */

  @ChatManagerSubscribe('onChatDataLoad')
  onChatManagerIntialized(dataLoader: DataLoader): void { 
    this.logger_.warn(`onChatDataLoad: ${dataLoader}`);
  }

  @ChatManagerSubscribe('onUserConnecting')
  onUserConnecting() {

  }

  @ChatManagerSubscribe('onChannelCreating')
  onChannelCreating(event: any): boolean { 
    return true;
  }
}
