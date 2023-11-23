import {
  ReturnCodeEnum,
} from '../enum';

export interface ReturnMessage {
  event?: string;
  code: ReturnCodeEnum;
  message: string;
  data?: any;
}
