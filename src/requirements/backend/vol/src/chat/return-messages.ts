import { ReturnCode } from './enums';
import { ReturnMessage } from './interfaces';

export { ReturnCode, ReturnMessage };

export const ReturnMessages: Record<ReturnCode, ReturnMessage> = {
  [ReturnCode.ALLOWED]: {
    code: ReturnCode.ALLOWED,
    message: "Allowed",
  },
  [ReturnCode.DENIED]: {
    code: ReturnCode.DENIED,
    message: "Denied",
  },
  [ReturnCode.USER_NOT_EXISTS]: {
    code: ReturnCode.USER_NOT_EXISTS,
    message: "User not exists",
  },
  [ReturnCode.USER_NOT_CONNECTED]: {
    code: ReturnCode.USER_NOT_CONNECTED,
    message: "User not connected",
  },
  [ReturnCode.USER_IN_GAME]: {
    code: ReturnCode.USER_IN_GAME,
    message: "User in game",
  },
  [ReturnCode.USER_AWAY]: {
    code: ReturnCode.USER_AWAY,
    message: "User away",
  },
  [ReturnCode.NAME_IN_USE]: {
    code: ReturnCode.NAME_IN_USE,
    message: "Name in use",
  },
  [ReturnCode.CHANNEL_NOT_EXISTS]: {
    code: ReturnCode.CHANNEL_NOT_EXISTS,
    message: "Channel not exists",
  },
  [ReturnCode.CHANNEL_EXISTS]: {
    code: ReturnCode.CHANNEL_EXISTS,
    message: "Channel exists",
  },
  [ReturnCode.NOT_IN_CHANNEL]: {
    code: ReturnCode.NOT_IN_CHANNEL,
    message: "You're not in that channel",
  },
  [ReturnCode.ALREADY_IN_CHANNEL]: {
    code: ReturnCode.ALREADY_IN_CHANNEL,
    message: "You're already in that channel",
  },
  [ReturnCode.PENDING_CHALLENGE]: {
    code: ReturnCode.PENDING_CHALLENGE,
    message: "You have a pending challenge request",
  },
  [ReturnCode.BAD_CHANNEL_NAME]: {
    code: ReturnCode.BAD_CHANNEL_NAME,
    message: "Bad channel name",
  },
  [ReturnCode.CANNOT_SEND_TO_CHANNEL]: {
    code: ReturnCode.CANNOT_SEND_TO_CHANNEL,
    message: "Cannot send to channel",
  },
  [ReturnCode.INVALID_PASSWORD]: {
    code: ReturnCode.INVALID_PASSWORD,
    message: "Password incorrect",
  },
  [ReturnCode.INSUFFICIENT_PRIVILEGES]: {
    code: ReturnCode.INSUFFICIENT_PRIVILEGES,
    message: "Insufficient privileges",
  },
  [ReturnCode.BANNED_FROM_CHANNEL]: {
    code: ReturnCode.BANNED_FROM_CHANNEL,
    message: "Banned from channel",
  },
  [ReturnCode.NOTHING_HAPPENED]: {
    code: ReturnCode.NOTHING_HAPPENED,
    message: "Nothing happened",
  },
  [ReturnCode.BAD_USER_NAME]: {
    code: ReturnCode.BAD_USER_NAME,
    message: "Bad username",
  },
  [ReturnCode.ERROR]: {
    code: ReturnCode.ERROR,
    message: "Error",
  },
};
