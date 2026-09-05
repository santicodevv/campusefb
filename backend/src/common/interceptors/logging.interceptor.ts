import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from 'express';

interface RequestWithUser extends Request {
  user?: { id: number | string };
}

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<RequestWithUser>();
    const response = ctx.getResponse<Response>();

    // Generar correlation ID
    const correlationId =
      (request.headers['x-correlation-id'] as string) || uuidv4();
    request.headers['x-correlation-id'] = correlationId;
    response.setHeader('x-correlation-id', correlationId);

    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const userId = request.user?.id || 'anonymous';

    const startTime = Date.now();

    this.logger.log(
      `[${correlationId}] ${method} ${url} - User: ${userId} - IP: ${ip} - UA: ${userAgent}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;

          this.logger.log(
            `[${correlationId}] ${method} ${url} - ${statusCode} - ${duration}ms`,
          );
        },
        error: (error: ErrorWithStatus) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || error.statusCode || 500;

          if (statusCode >= 400 && statusCode < 500) {
            this.logger.warn(
              `[${correlationId}] ${method} ${url} - ${statusCode} - ${duration}ms - Client Error: ${error.message}`,
            );
          } else {
            this.logger.error(
              `[${correlationId}] ${method} ${url} - ${statusCode} - ${duration}ms - Server Error: ${error.message}`,
              error.stack,
            );
          }
        },
      }),
    );
  }
}
