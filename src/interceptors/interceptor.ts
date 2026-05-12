import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor, } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import { map, Observable, tap } from 'rxjs';

@Injectable()
export class ElapsedTimeInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ElapsedTimeInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = performance.now();
    const { request,response } = this.getRequestResponse(context);

    if (request && this.canRender(response) && this.isPageRequest(request)) {
      this.patchRender(response, startedAt);
    }

    return next.handle().pipe(
      map((data) => {
        const elapsedMs = this.getElapsedMs(startedAt);

        if (this.canSetHeaders(response) && !response.headersSent) {
          response.setHeader('X-Elapsed-Time', `${elapsedMs}ms`);
        }

        if (request && this.canRender(response) && this.isPageRequest(request) && this.isPlainObject(data)) {
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

  private getRequestResponse(context: ExecutionContext) {
    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context).getContext<{
        req?: Request;
        res?: Response;
      }>();

      return {
        request: gqlContext?.req,
        response: gqlContext?.res,
      };}

    return {
      request: context.switchToHttp().getRequest<Request>(),
      response: context.switchToHttp().getResponse<Response>(),
    };
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

  private canSetHeaders(response: unknown): response is Response {
    return !!response && typeof (response as Response).setHeader === 'function';
  }

  private canRender(response: unknown): response is Response {
    return (
      this.canSetHeaders(response) &&
      typeof (response as Response).render === 'function' &&
      !!(response as Response).locals
    );
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && value.constructor === Object;
  }
}
