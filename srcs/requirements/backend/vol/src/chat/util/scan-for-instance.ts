import { isFunction, isUndefined } from '@nestjs/common/utils/shared.utils';

export function scanForInstance(instance: any): string | undefined {
  const isInstance = Reflect.getMetadata("chatmanager:instance", instance.constructor);//, property);
  if (!isUndefined(isInstance)) {
      return isInstance;
  }
}
