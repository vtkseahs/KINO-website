import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger, } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType<string>() === 'graphql') {
      throw exception;
    }
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isApiRequest = request.url.startsWith('/api');

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Внутренняя ошибка сервера';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const typed = exceptionResponse as Record<string, unknown>;
        message = (typed.message as string | string[]) ?? message;
        error = (typed.error as string) ?? error;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Ошибка уникальности';
        error = 'Conflict';
      } else if (exception.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Связанная запись не найдена';
        error = 'Bad Request';
      }
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`Ошибка при обработке ${request.method} ${request.path}`, exception instanceof Error ? exception.stack : String(exception));
    }

    if (isApiRequest) {
      return response.status(status).json({
        statusCode: status,
        message,
        error
      });
    }

    return response.status(status).render('error', {
      title: `Ошибка ${status}`,
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
    });
  }
}
