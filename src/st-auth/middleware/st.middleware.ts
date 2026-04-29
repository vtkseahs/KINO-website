import { Injectable, NestMiddleware } from '@nestjs/common';
import { middleware } from 'supertokens-node/framework/express';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class StMiddleware implements NestMiddleware {
  private readonly handler = middleware();

  use(req: Request, res: Response, next: NextFunction) {
    return this.handler(req, res, next);
  }
}