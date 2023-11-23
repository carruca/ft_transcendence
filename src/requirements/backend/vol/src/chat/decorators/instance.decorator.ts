import { CHATMANAGERINSTANCE } from '../constants';

export const ChatManagerInstance = (): PropertyDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    Reflect.set(target, propertyKey, null);
    Reflect.defineMetadata(CHATMANAGERINSTANCE, propertyKey, target.constructor);
  };
};
