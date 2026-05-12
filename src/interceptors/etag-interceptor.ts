import { CallHandler, ExecutionContext, Injectable, NestInterceptor, } from '@nestjs/common';
import { createHash } from 'crypto';
import type { Request, Response } from 'express';
import { map, Observable } from 'rxjs';

@Injectable()
export class PublicCacheInterceptor implements NestInterceptor {
  private readonly maxAgeSeconds = 3600;

  private readonly cacheablePaths = [
    /^\/api\/movies(?:\/\d+)?$/,
    /^\/api\/movies\/\d+\/reviews$/,
    /^\/api\/reviews(?:\/\d+)?$/,
    /^\/api\/subscriptions(?:\/\d+)?$/,
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<string>() === 'graphql') {
      return next.handle();
    }
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    if (!request || !response || !this.isCacheableRequest(request)) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        if (response.headersSent) {
          return data;
        }

        const payload = JSON.stringify(data);
        const etag = `"${createHash('sha1').update(payload).digest('hex')}"`;

        response.setHeader('Cache-Control', `public, max-age=${this.maxAgeSeconds}, must-revalidate`,);
        response.setHeader('ETag', etag);

        if (request.headers['if-none-match'] === etag) {
          response.status(304);
          return undefined;
        }
        return data;
      }),
    );
  }

  private isCacheableRequest(request: Request): boolean {
    if (request.method !== 'GET') {
      return false;
    }

    const path = request.path || request.url.split('?')[0];

    return this.cacheablePaths.some((pattern) => pattern.test(path));
  }
}