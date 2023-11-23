import { scanForInstance } from '../utils';

export const ChatManagerHandler = () => {
  return function<T extends { new (...args: any[]): {} }>(target: T) {
    return class extends target {
      //chat_: ChatManager;

      constructor(...args: any[]) {
        super(...args);
        const instance: any = this;
        const instanceKey = scanForInstance(instance);
        if (instanceKey)
          instance[instanceKey].autoSubscribeEvents(instance);
      }
    }
  }
};
