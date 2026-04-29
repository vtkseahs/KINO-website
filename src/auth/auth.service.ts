import { ConflictException, ForbiddenException, Injectable, UnauthorizedException, } from '@nestjs/common';
import type { Request, Response } from 'express';
import SuperTokens from 'supertokens-node';
import type { RecipeUserId } from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import { Role } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string, req?: Request, res?: Response,) {
    const result = await EmailPassword.signIn('public', email, password);

    if (result.status === 'WRONG_CREDENTIALS_ERROR') {
      return null;
    }

    await this.createSuperTokensSession(req, res, result.recipeUserId);

    return this.syncLocalUser({
      superTokensUserId: result.user.id,
      email: result.user.emails[0] ?? email,
      name: result.user.emails[0]?.split('@')[0],
    });
  }

  async register(name: string, email: string, password: string, req?: Request, res?: Response,) {
    const result = await EmailPassword.signUp('public', email, password);

    if (result.status === 'EMAIL_ALREADY_EXISTS_ERROR') {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    await this.createSuperTokensSession(req, res, result.recipeUserId);

    return this.syncLocalUser({
      superTokensUserId: result.user.id,
      email,
      name,
    });
  }

  async getCurrentUser(req: Request, res?: Response) {
    const session = await this.getOptionalSession(req, res);

    if (!session) {
      return null;
    }

    const superTokensUserId = session.getUserId();

    const localUser = await this.prisma.user.findUnique({
      where: { superTokensUserId },
      select: userSelect,
    });

    if (localUser) {
      return localUser;
    }

    const superTokensUser = await SuperTokens.getUser(superTokensUserId);
    const email = superTokensUser?.emails[0];

    if (!email) {
      return null;
    }

    return this.syncLocalUser({
      superTokensUserId,
      email,
      name: email.split('@')[0],
    });
  }

  async getAuthData(req: Request, res?: Response) {
    const user = await this.getCurrentUser(req, res);

    return {
      isAuth: !!user,
      isAdmin: user?.role === Role.ADMIN,
      user,
    };
  }

  async requireUser(req: Request, res?: Response) {
    const user = await this.getCurrentUser(req, res);

    if (!user) {
      throw new UnauthorizedException('Необходимо войти в аккаунт');
    }

    return user;
  }

  async requireAdmin(req: Request, res?: Response) {
    const user = await this.requireUser(req, res);

    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Недостаточно прав');
    }

    return user;
  }

  async logout(req: Request, res: Response) {
    const session = await this.getOptionalSession(req, res);

    if (session) {
      await session.revokeSession();
    }

    this.clearSessionCookies(res);
  }

  private async syncLocalUser(params: {
    superTokensUserId: string;
    email: string;
    name?: string;
  }) {
    const existingBySuperTokensId = await this.prisma.user.findUnique({
      where: { superTokensUserId: params.superTokensUserId },
      select: userSelect,
    });

    if (existingBySuperTokensId) {
      return existingBySuperTokensId;
    }

    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: params.email },
      select: userSelect,
    });

    if (existingByEmail) {
      return this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          superTokensUserId: params.superTokensUserId,
        },
        select: userSelect,
      });
    }

    return this.prisma.user.create({
      data: {
        email: params.email,
        name: params.name || params.email.split('@')[0],
        password: '',
        role: Role.USER,
        superTokensUserId: params.superTokensUserId,
      },
      select: userSelect,
    });
  }

  private async createSuperTokensSession(
    req: Request | undefined,
    res: Response | undefined,
    recipeUserId: RecipeUserId,
  ) {
    if (!req || !res) {
      return;
    }

    await Session.createNewSession(req, res, 'public', recipeUserId);
  }

  private async getOptionalSession(req: Request, res?: Response) {
    try {
      if (!res) {
        return undefined;
      }
      return await Session.getSession(req, res, {
        sessionRequired: false,
        antiCsrfCheck: false,
      });
    } catch {
      return undefined;
    }
  }

  private clearSessionCookies(res: Response) {
    res.clearCookie('sAccessToken', { path: '/' });
    res.clearCookie('sRefreshToken', { path: '/' });
    res.clearCookie('sFrontToken', { path: '/' });
  }
}