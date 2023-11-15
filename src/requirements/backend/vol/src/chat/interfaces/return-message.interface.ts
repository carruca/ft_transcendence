import { ReturnCode } from '../enums'

export interface ReturnMessage {
  code: ReturnCode;
  message: string;
  data?: any;
}
