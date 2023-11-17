import { ReturnCode } from './enums'
import { ReturnMessage } from './interfaces'

export { ReturnCode, ReturnMessage }

export const ReturnMessages: Record<ReturnCode, ReturnMessage> = {
  [ReturnCode.Allowed]: {
    code: ReturnCode.Allowed,
    message: "Allowed",
  },
  [ReturnCode.Denied]: {
    code: ReturnCode.Denied,
    message: "Denied",
  },
  [ReturnCode.UserNotExists]: {
    code: ReturnCode.UserNotExists,
    message: "User not exists",
  },
  [ReturnCode.UserNotConnected]: {
    code: ReturnCode.UserNotConnected,
    message: "User not connected",
  },
  [ReturnCode.UserInGame]: {
    code: ReturnCode.UserInGame,
    message: "User in game",
  },
  [ReturnCode.UserAway]: {
    code: ReturnCode.UserAway,
    message: "User away",
  },
  [ReturnCode.NameInUse]: {
    code: ReturnCode.NameInUse,
    message: "Name in use",
  },
  [ReturnCode.ChannelNotExists]: {
    code: ReturnCode.ChannelNotExists,
    message: "Channel not exists",
  },
  [ReturnCode.ChannelExists]: {
    code: ReturnCode.ChannelExists,
    message: "Channel exists",
  },
  [ReturnCode.NotInChannel]: {
    code: ReturnCode.NotInChannel,
    message: "You're not in that channel",
  },
  [ReturnCode.AlreadyInChannel]: {
    code: ReturnCode.AlreadyInChannel,
    message: "You're already in that channel",
  },
  [ReturnCode.PendingChallenge]: {
    code: ReturnCode.PendingChallenge,
    message: "You have a pending challenge request",
  },
  [ReturnCode.BadChannelName]: {
    code: ReturnCode.BadChannelName,
    message: "Bad channel name",
  },
  [ReturnCode.CannotSendToChannel]: {
    code: ReturnCode.CannotSendToChannel,
    message: "Cannot send to channel",
  },
  [ReturnCode.InvalidPassword]: {
    code: ReturnCode.InvalidPassword,
    message: "Password incorrect",
  },
  [ReturnCode.InsufficientPrivileges]: {
    code: ReturnCode.InsufficientPrivileges,
    message: "Insufficient privileges",
  },
  [ReturnCode.BannedFromChannel]: {
    code: ReturnCode.BannedFromChannel,
    message: "Banned from channel",
  },
  [ReturnCode.NothingHappened]: {
    code: ReturnCode.NothingHappened,
    message: "Nothing happened",
  },
  [ReturnCode.BadUserName]: {
    code: ReturnCode.BadUserName,
    message: "Bad username",
  },
  [ReturnCode.Error]: {
    code: ReturnCode.Error,
    message: "Error",
  },
};
