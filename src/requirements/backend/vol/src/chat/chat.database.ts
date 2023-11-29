import {
  ChatManager,
} from './manager';

import {
  ChatManagerHandler,
  ChatManagerInstance,
  ChatManagerSubscribe,
} from './decorator';

import {
  ChannelsService,
} from '../channels/channels.service';

import {
  UsersService,
} from '../users/users.service';

import { 
  Logger,
} from '@nestjs/common';

import { 
  v4 as uuidv4,
} from 'uuid';

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
  async onChatManagerIntialized(event: any) {
    for (const userDB of await this.usersService_.findAllWithFriendsAndBlocks()) {
      console.log(userDB);
      if (userDB.nickname)
        this.chatManager_.addUserDB(userDB);
    }
    for (const channelDB of await this.channelsService_.findAllWithUsers()) {
      this.chatManager_.addChannelDB(channelDB);
    }
  }

  @ChatManagerSubscribe('onChannelCreated')
  onChannelCreated(event: any) {
    
  }

  @ChatManagerSubscribe('onChannelDeleted')
  onChannelDeleted(event: any) {

  }
}
