import { CHATMANAGEREVENT } from '../constants'

export const ChatManagerSubscribe = (eventName: string): MethodDecorator => {
    return (
      target: any,
      key: string | symbol,
      descriptor: PropertyDescriptor
    ) => {
        Reflect.defineMetadata(CHATMANAGEREVENT, eventName, descriptor.value);
        return descriptor;
    };
};
