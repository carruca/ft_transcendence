import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { MockService } from './mock.service';

@Injectable()
export class MockCallbackInterceptor implements NestInterceptor {

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {  // TODO: Typing
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { secure } = req;
    if (process.env.NEST_AUTH_MOCK === 'true' && req.query.mock === 'true') {
      const data = await new MockService().login(req.query.code);
      res.cookie(
        'token',
        data.access_token,
        {
          httpOnly: false,
          signed: true,
          sameSite: secure ? 'none' : 'lax',
          maxAge: 3600000,
          secure
        }
      );
      res.cookie(
        'refresh_token',
        data.refresh_token,
        {
          httpOnly: false,
          signed: true,
          sameSite: secure ? 'none' : 'lax',
          maxAge: 3600000,
          secure
        }
      );
      res.cookie(
        'auth_method',
        'mock',
        {
          httpOnly: false,
          signed: true,
          sameSite: secure ? 'none' : 'lax',
          maxAge: 3600000,
          secure
        });
      return data;
    }
    return next.handle();
  }
}
