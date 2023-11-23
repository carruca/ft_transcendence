import { ReturnCodeEnum } from './enums';
import { ReturnMessage } from './interfaces';

export { ReturnCodeEnum, ReturnMessage };

export const ReturnMessages: Record<ReturnCodeEnum, ReturnMessage> = {
  [ReturnCodeEnum.ALLOWED]: {
    code: ReturnCodeEnum.ALLOWED,
    message: "Allowed",
  },
  [ReturnCodeEnum.DENIED]: {
    code: ReturnCodeEnum.DENIED,
    message: "Denied",
  },
  [ReturnCodeEnum.USER_NOT_EXISTS]: {
    code: ReturnCodeEnum.USER_NOT_EXISTS,
    message: "User not exists",
  },
  [ReturnCodeEnum.USER_NOT_CONNECTED]: {
    code: ReturnCodeEnum.USER_NOT_CONNECTED,
    message: "User not connected",
  },
  [ReturnCodeEnum.USER_IN_GAME]: {
    code: ReturnCodeEnum.USER_IN_GAME,
    message: "User in game",
  },
  [ReturnCodeEnum.YOURE_IN_GAME]: {
    code: ReturnCodeEnum.YOURE_IN_GAME,
    message: "You are in game",
  },
  [ReturnCodeEnum.USER_AWAY]: {
    code: ReturnCodeEnum.USER_AWAY,
    message: "User away",
  },
  [ReturnCodeEnum.NAME_IN_USE]: {
    code: ReturnCodeEnum.NAME_IN_USE,
    message: "Name in use",
  },
  [ReturnCodeEnum.CHANNEL_NOT_EXISTS]: {
    code: ReturnCodeEnum.CHANNEL_NOT_EXISTS,
    message: "Channel not exists",
  },
  [ReturnCodeEnum.CHANNEL_EXISTS]: {
    code: ReturnCodeEnum.CHANNEL_EXISTS,
    message: "Channel exists",
  },
  [ReturnCodeEnum.NOT_IN_CHANNEL]: {
    code: ReturnCodeEnum.NOT_IN_CHANNEL,
    message: "You're not in that channel",
  },
  [ReturnCodeEnum.ALREADY_IN_CHANNEL]: {
    code: ReturnCodeEnum.ALREADY_IN_CHANNEL,
    message: "You're already in that channel",
  },
  [ReturnCodeEnum.PENDING_CHALLENGE]: {
    code: ReturnCodeEnum.PENDING_CHALLENGE,
    message: "You have a pending challenge request",
  },
  [ReturnCodeEnum.BAD_CHANNEL_NAME]: {
    code: ReturnCodeEnum.BAD_CHANNEL_NAME,
    message: "Bad channel name",
  },
  [ReturnCodeEnum.CANNOT_SEND_TO_CHANNEL]: {
    code: ReturnCodeEnum.CANNOT_SEND_TO_CHANNEL,
    message: "Cannot send to channel",
  },
  [ReturnCodeEnum.INVALID_PASSWORD]: {
    code: ReturnCodeEnum.INVALID_PASSWORD,
    message: "Password incorrect",
  },
  [ReturnCodeEnum.INSUFFICIENT_PRIVILEGES]: {
    code: ReturnCodeEnum.INSUFFICIENT_PRIVILEGES,
    message: "Insufficient privileges",
  },
  [ReturnCodeEnum.BANNED_FROM_CHANNEL]: {
    code: ReturnCodeEnum.BANNED_FROM_CHANNEL,
    message: "Banned from channel",
  },
  [ReturnCodeEnum.NOTHING_HAPPENED]: {
    code: ReturnCodeEnum.NOTHING_HAPPENED,
    message: "Nothing happened",
  },
  [ReturnCodeEnum.BAD_USER_NAME]: {
    code: ReturnCodeEnum.BAD_USER_NAME,
    message: "Bad username",
  },
  [ReturnCodeEnum.ERROR]: {
    code: ReturnCodeEnum.ERROR,
    message: "Error",
  },
};
