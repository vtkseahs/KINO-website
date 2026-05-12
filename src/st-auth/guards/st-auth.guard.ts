import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import Session from 'supertokens-node/recipe/session';
import { Role } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service';
import { PUBLIC_ACCESS_KEY } from '../decorators/public-access.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { Response } from 'express';
import type { StRequest } from '../types/st-request';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class SuperTokensAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const { req, res } = this.getRequestResponse(context);

    if (!req || !res) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    let session;

    try {
      session = await Session.getSession(req, res, {
        antiCsrfCheck: false,
      });
    } catch {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    const superTokensUserId = session.getUserId();

    req.session = session;
    req.superTokensUserId = superTokensUserId;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = await this.prisma.user.findFirst({
      where: {
        superTokensUserId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не связан с локальным аккаунтом');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
    return true;
  }

  private getRequestResponse(context: ExecutionContext) {
    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context).getContext<{ req: StRequest; res: Response }>();

      return {
        req: gqlContext.req,
        res: gqlContext.res,
      };
    }
    return {
      req: context.switchToHttp().getRequest<StRequest>(),
      res: context.switchToHttp().getResponse<Response>(),
    };
  }

}