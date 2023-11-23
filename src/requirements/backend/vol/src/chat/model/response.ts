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
}

export class Response {
  private event: string;
  private error: string = 'reterr';
  private users: User[];
  private sourceUser: User;

  constructor(
    private code: ErrorCode = ErrorCode.SUCCESS,
    private message: string = 'Success',
    private data: any,
  ) {}

  setCode(code: ErrorCode): Response {
    this.code = code;
    return this;
  }

  setMessage(message: string): Response {
    this.message = message;
    return this;
  }

  setData(data: any): Response {
    this.data = data;
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

  usersToSend(users: User[]): Response {
    this.users = users;
    return this;
  }

  get JSON(): string {
    return JSON.stringify({
      code: this.code,
      message: this.message,
      data: this.data,
    })
  }

  send() {
    const dataJSON = this.JSON;

    if (this.code !== ErrorCode.SUCCESS) {
      this.sourceUser.socket.emit(this.error, dataJSON);
    } else {
      if (this.users) {
        for (const user of this.users) {
          user.socket.emit(this.event, dataJSON);
        }
      } else {
         this.sourceUser.socket.emit(this.event, dataJSON);
      }
    }
  }

  static Denied(data?: any): Response {
    return new Response(ErrorCode.DENIED, "Denied", data);
  }

  static AlreadyInChannel(data?: any): Response {
    return new Response(ErrorCode.ALREADY_IN_CHANNEL, "Already in channel", data);
  }

  static BannedFromChannel(data?: any): Response {
    return new Response(ErrorCode.BANNED_FROM_CHANNEL, "You are banned from channel", data);
  }

  static InvalidPassword(data?: any): Response {
    return new Response(ErrorCode.INVALID_PASSWORD, "Invalid password", data);
  }

  static Success(data?: any): Response {
    return new Response(ErrorCode.SUCCESS, "Success", data);
  }

  static BadChannelName(data?: any): Response {
    return new Response(ErrorCode.BAD_CHANNEL_NAME, "Bad channel name", data);
  }

  static ChannelExists(data?: any): Response {
    return new Response(ErrorCode.CHANNEL_EXISTS, "Channel exists", data);
  }

  static ChannelNotExists(data?: any): Response {
    return new Response(ErrorCode.CHANNEL_NOT_EXISTS, "Channel not exists", data);
  }
}
