import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor, } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import { map, Observable, tap } from 'rxjs';

@Injectable()
export class ElapsedTimeInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ElapsedTimeInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = performance.now();
    const request = this.getRequest(context);
    const response = this.getResponse(context);

    if (request && response && this.isPageRequest(request)) {
      this.patchRender(response, startedAt);
    }

    return next.handle().pipe(
      map((data) => {
        const elapsedMs = this.getElapsedMs(startedAt);

        if (response && !response.headersSent) {
          response.setHeader('X-Elapsed-Time', `${elapsedMs}ms`);
        }

        if (request && response && this.isPageRequest(request) && this.isPlainObject(data)) {
          response.locals.serverElapsedTimeMs = elapsedMs;
          return {
            ...data,
            serverElapsedTimeMs: elapsedMs,
          };
        }
        return data;
      }),
      tap({
        next: () => this.logRequest(context, request, startedAt),
        error: () => this.logRequest(context, request, startedAt),
      }),
    );
  }

  private getRequest(context: ExecutionContext): Request | undefined {
    const httpRequest = context.switchToHttp().getRequest<Request>();
    if (httpRequest) {
      return httpRequest;
    }
    if (context.getType<'graphql'>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context).getContext<{ req?: Request }>();
      return gqlContext?.req;
    }

    return undefined;
  }

  private getResponse(context: ExecutionContext): Response | undefined {
    const httpResponse = context.switchToHttp().getResponse<Response>();
    if (httpResponse) {
      return httpResponse;
    }
    if (context.getType<'graphql'>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context).getContext<{ res?: Response }>();
      return gqlContext?.res;
    }
    return undefined;
  }

  private isPageRequest(request: Request): boolean {
    const url = request.originalUrl || request.url;
    return !url.startsWith('/api') && !url.startsWith('/graphql');
  }

  private patchRender(response: Response, startedAt: number) {
    const originalRender = response.render.bind(response);

    response.render = ((view: string, options?: object | Function, callback?: Function) => {
      const elapsedMs = this.getElapsedMs(startedAt);
      response.locals.serverElapsedTimeMs = elapsedMs;

      if (!response.headersSent) {
        response.setHeader('X-Elapsed-Time', `${elapsedMs}ms`);
      }
      if (typeof options === 'function') {
        return originalRender(view, { serverElapsedTimeMs: elapsedMs }, options);
      }

      return originalRender(view, { ...(this.isPlainObject(options) ? options : {}), serverElapsedTimeMs: elapsedMs}, callback as never,);
    }) as Response['render'];
  }

  private getElapsedMs(startedAt: number): number {
    return Math.round(performance.now() - startedAt);
  }

  private logRequest(
    context: ExecutionContext,
    request: Request | undefined,
    startedAt: number,
  ) {
    const elapsedMs = this.getElapsedMs(startedAt);
    const type = context.getType<string>();
    const path = request?.originalUrl || request?.url || 'unknown';
    this.logger.log(`${type.toUpperCase()} ${path} - ${elapsedMs}ms`);
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && value.constructor === Object;
  }
}