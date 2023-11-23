export function Deprecated(): MethodDecorator {
  return (target: any, key: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    console.warn(`Deprecated: ${target.constructor.name}.${String(key)}`);
    descriptor.value = function (...args: any[]) {
//      console.warn('Arguments:', [...args]);
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}
