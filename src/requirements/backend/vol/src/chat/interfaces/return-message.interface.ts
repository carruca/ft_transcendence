import { ReturnCode } from '../enums'

export interface ReturnMessage {
  event?: string;
  code: ReturnCode;
  message: string;
  data?: any;
}
