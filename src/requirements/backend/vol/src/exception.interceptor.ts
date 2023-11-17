import {
    Catch,
    ExceptionFilter,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';

@Catch()
export class ExceptionInterceptor implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        if (request.url.startsWith('/public'))
        {
            return response.status(404).send();
        }

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.I_AM_A_TEAPOT;
        const message =
            exception instanceof HttpException
                ? exception.message
                : 'I am a teapot'

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
        });
    }
}
