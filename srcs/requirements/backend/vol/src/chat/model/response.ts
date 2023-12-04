import {
  User,
} from '.';

enum ResponseCode {
  SUCCESS,
  DENIED,
  USER_NOT_EXISTS,
  USER_NOT_CONNECTED,
  USER_IN_GAME,
  USER_AWAY,
  YOURE_IN_GAME,
  CHANNEL_NOT_EXISTS,
  CHANNEL_EXISTS,
  NOT_IN_CHANNEL,
  ALREADY_IN_CHANNEL,
  PENDING_CHALLENGE,
  BAD_CHANNEL_NAME,
  BAD_CHANNEL_PASSWORD,
  CANNOT_SEND_TO_CHANNEL,
  INSUFFICIENT_PRIVILEGES,
  BANNED_FROM_CHANNEL,
  BANNED_FROM_SITE,
  ACCOUNT_DISABLED,
  CONVERSATION_NOT_EXISTS,
  USER_ALREADY_BANNED,
  USER_NOT_BANNED,
  USER_ALREADY_BLOCKED,
  USER_NOT_BLOCKED,
  SAME_CHANNEL_PASSWORD,
  SAME_USER,
  USER_ALREADY_MODERATOR,
  USER_NOT_MODERATOR,
  HIGHER_PRIVILEGES,
  USER_ALREADY_MUTED,
  USER_NOT_MUTED,
  USER_ALREADY_ADMIN,
  USER_NOT_ADMIN,
}

export class Response {
  private event: string;
  private error: string = 'reterror';
  private success: string = 'retsuccess';
  private sourceUser: User;

  constructor(
    private code_: ResponseCode = ResponseCode.SUCCESS,
    private message: string = 'Success',
  ) {}

  setCode(code: ResponseCode): Response {
    this.code_ = code;
    return this;
  }

  setMessage(message: string): Response {
    this.message = message;
    return this;
  }

  setEvent(event: string): Response {
    this.event = event;
    return this;
  }

  setError(error: string): Response {
    this.error = error;
    return this;
  }

  setSourceUser(user: User): Response {
    this.sourceUser = user;
    return this;
  }
  
  get code(): ResponseCode {
    return this.code_;
  }

  get JSON(): string {
    return JSON.stringify({
      event: this.event,
      code: this.code_,
      message: this.message,
    });
  }

  send() {
    if (this.code === ResponseCode.SUCCESS) {
      if (this.sourceUser.socket)
        this.sourceUser.socket.emit(this.success, this.JSON);
    }
    else {
      if (this.sourceUser.socket)
        this.sourceUser.socket.emit(this.error, this.JSON);
    }
  }

  static PendingChallenge(): Response {
    return new Response(ResponseCode.PENDING_CHALLENGE, "Pending Challenge");
  }

  static Denied(): Response {
    return new Response(ResponseCode.DENIED, "Denied");
  }

  static UserAway(): Response {
    return new Response(ResponseCode.USER_AWAY, "User away");
  }

  static UserNotConnected(): Response {
    return new Response(ResponseCode.USER_NOT_CONNECTED, "User not connected");
  }

  static NotInChannel(): Response {
    return new Response(ResponseCode.NOT_IN_CHANNEL, "You are not in that channel")
  }

  static AlreadyInChannel(): Response {
    return new Response(ResponseCode.ALREADY_IN_CHANNEL, "Already in channel");
  }

  static BannedFromChannel(): Response {
    return new Response(ResponseCode.BANNED_FROM_CHANNEL, "You are banned from channel");
  }

  static BadChannelPassword(): Response {
    return new Response(ResponseCode.BAD_CHANNEL_PASSWORD, "Bad channel password");
  }

  static Success(): Response {
    return new Response();
  }

  static BadChannelName(): Response {
    return new Response(ResponseCode.BAD_CHANNEL_NAME, "Bad channel name");
  }

  static ChannelExists(): Response {
    return new Response(ResponseCode.CHANNEL_EXISTS, "Channel exists");
  }

  static ChannelNotExists(): Response {
    return new Response(ResponseCode.CHANNEL_NOT_EXISTS, "Channel not exists");
  }

  static InsufficientPrivileges(): Response {
    return new Response(ResponseCode.INSUFFICIENT_PRIVILEGES, "Insufficient privileges");
  }

  static UserNotExists(): Response {
    return new Response(ResponseCode.USER_NOT_EXISTS, "User not exists");
  }

  static BannedFromSite(): Response {
    return new Response(ResponseCode.BANNED_FROM_SITE, "You're banned from this site");
  }

  static AccountDisabled(): Response {
    return new Response(ResponseCode.ACCOUNT_DISABLED, "Your account are disabled");
  }

  static YoureInGame(): Response {
    return new Response(ResponseCode.YOURE_IN_GAME, "You are in game");
  }

  static UserInGame(): Response {
    return new Response(ResponseCode.USER_IN_GAME, "user in game");
  }

  static CannotSendToChannel(): Response {
    return new Response(ResponseCode.CANNOT_SEND_TO_CHANNEL, "Cannot send to channel");
  }

  static ConversationNotExists(): Response {
    return new Response(ResponseCode.CONVERSATION_NOT_EXISTS, "There is no conversation");
  }

  static UserAlreadyBanned(): Response {
    return new Response(ResponseCode.USER_ALREADY_BANNED, "User already banned");
  }

  static UserNotBanned(): Response {
    return new Response(ResponseCode.USER_NOT_BANNED, "Unbanned user");
  }

  static UserAlreadyBlocked(): Response {
    return new Response(ResponseCode.USER_ALREADY_BLOCKED, "User already blocked");
  }

  static UserNotBlocked(): Response {
    return new Response(ResponseCode.USER_NOT_BLOCKED, "User not blocked");
  }

  static SameChannelPassword(): Response {
    return new Response(ResponseCode.SAME_CHANNEL_PASSWORD, "Channel has same password");
  }

  static SameUser(): Response {
    return new Response(ResponseCode.SAME_USER, "Same user");
  }

  static UserAlreadyModerator(): Response {
    return new Response(ResponseCode.USER_ALREADY_MODERATOR, "User is already a moderator")
  }

  static UserNotModerator(): Response {
    return new Response(ResponseCode.USER_NOT_MODERATOR, "User is not a moderator");
  }

  static HigherPrivileges(): Response {
    return new Response(ResponseCode.HIGHER_PRIVILEGES, "Target user has higher privileges than you.");
  }

  static UserAlreadyMuted(): Response {
    return new Response(ResponseCode.USER_ALREADY_MUTED, "User already muted");
  }

  static UserNotMuted(): Response {
    return new Response(ResponseCode.USER_NOT_MUTED, "User not muted");
  }
  
  static UserNotAdmin(): Response {
  	return new Response(ResponseCode.USER_NOT_ADMIN, "User not admin");
  }

  static UserAlreadyAdmin(): Response {
	return new Response(ResponseCode.USER_ALREADY_ADMIN, "User already admin");
  }
}
