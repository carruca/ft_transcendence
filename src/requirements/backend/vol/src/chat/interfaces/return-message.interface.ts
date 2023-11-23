import {
  ReturnCodeEnum,
} from '../enums';

export interface ReturnMessage {
  event?: string;
  code: ReturnCodeEnum;
  message: string;
  data?: any;
}
