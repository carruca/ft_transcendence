import {
  UserModel as User,
} from '.';

enum ErrorCode {
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
  INVALID_PASSWORD,
  INSUFFICIENT_PRIVILEGES,
  BANNED_FROM_CHANNEL,
  BANNED_FROM_SITE,
  ACCOUNT_DISABLED,
}

export class Response {
  private event: string;
  private error: string = 'reterr';
  private sourceUser: User;

  constructor(
    private code: ErrorCode = ErrorCode.SUCCESS,
    private message: string = 'Success',
  ) {}

  setCode(code: ErrorCode): Response {
    this.code = code;
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

  get JSON(): string {
    return JSON.stringify({
      event: this.event,
      code: this.code,
      message: this.message,
    });
  }

  send() {
    if (this.code !== ErrorCode.SUCCESS) {
      this.sourceUser.socket.emit(this.error, this.JSON);
    }
  }

  static PendingChallenge(): Response {
    return new Response(ErrorCode.PENDING_CHALLENGE, "Pending Challenge");
  }

  static Denied(): Response {
    return new Response(ErrorCode.DENIED, "Denied");
  }

  static UserAway(): Response {
    return new Response(ErrorCode.USER_AWAY, "User away");
  }

  static UserNotConnected(): Response {
    return new Response(ErrorCode.USER_NOT_CONNECTED, "User not connected");
  }

  static NotInChannel(): Response {
    return new Response(ErrorCode.NOT_IN_CHANNEL, "You are not in that channel")
  }

  static AlreadyInChannel(): Response {
    return new Response(ErrorCode.ALREADY_IN_CHANNEL, "Already in channel");
  }

  static BannedFromChannel(): Response {
    return new Response(ErrorCode.BANNED_FROM_CHANNEL, "You are banned from channel");
  }

  static InvalidPassword(): Response {
    return new Response(ErrorCode.INVALID_PASSWORD, "Invalid password");
  }

  static Success(): Response {
    return new Response();
  }

  static BadChannelName(): Response {
    return new Response(ErrorCode.BAD_CHANNEL_NAME, "Bad channel name");
  }

  static ChannelExists(): Response {
    return new Response(ErrorCode.CHANNEL_EXISTS, "Channel exists");
  }

  static ChannelNotExists(): Response {
    return new Response(ErrorCode.CHANNEL_NOT_EXISTS, "Channel not exists");
  }

  static InsufficientPrivileges(): Response {
    return new Response(ErrorCode.INSUFFICIENT_PRIVILEGES, "Insufficient privileges");
  }

  static UserNotExists(): Response {
    return new Response(ErrorCode.USER_NOT_EXISTS, "User not exists");
  }

  static BannedFromSite(): Response {
    return new Response(ErrorCode.BANNED_FROM_SITE, "You're banned from this site");
  }

  static AccountDisabled(): Response {
    return new Response(ErrorCode.ACCOUNT_DISABLED, "Your account are disabled");
  }

  static YoureInGame(): Response {
    return new Response(ErrorCode.YOURE_IN_GAME, "You are in game");
  }

  static UserInGame(): Response {
    return new Response(ErrorCode.USER_IN_GAME, "user in game");
  }

  static CannotSendToChannel(): Response {
    return new Response(ErrorCode.CANNOT_SEND_TO_CHANNEL, "Cannot send to channel");
  }
}
