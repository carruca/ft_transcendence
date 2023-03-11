import { MockCallbackInterceptor } from './mock.interceptor';

describe('MockInterceptor', () => {
  it('should be defined', () => {
    expect(new MockCallbackInterceptor()).toBeDefined();
  });
});
