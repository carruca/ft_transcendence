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
  private chatManager_: ChatManager;

  constructor(
    chatManager: ChatManager,
    private readonly channelsService_: ChannelsService,
    private readonly usersService_: UsersService,
  ) {
    this.chatManager_ = chatManager;
    this.logger_.log("Instance created");
  }

  /*
  ** ChatService events handle
  */

  @ChatManagerSubscribe('onChatUserGetInfo')
  onChatUserConnecting(event: any): void {
    this.usersService_.findOneByIntraId(event.userIntraID).then(user => {
      event.user = user;
      console.log("event.user ", event.user);
    });
  }

  @ChatManagerSubscribe('onChatDataLoad')
  async onChatManagerIntialized(dataLoader: DataLoader): Promise<void> { 
    for (const userDB of await this.usersService_.findAll()) {
      this.chatManager_.addUserDB(userDB);
    }
    for (const channelDB of await this.channelsService_.findAll()) {
      console.log(channelDB);
      this.chatManager_.addChannelDB(channelDB);
    }
    this.logger_.warn(`onChatDataLoad: ${dataLoader}`);
  }

  @ChatManagerSubscribe('onChannelCreated')
  onChannelCreated(event: any) {
    
  }

  @ChatManagerSubscribe('onChannelDeleted')
  onChannelDeleted(event: any) {

  }
}
