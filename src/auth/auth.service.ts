import { ConflictException, ForbiddenException, Injectable, UnauthorizedException, } from '@nestjs/common';
import type { Request, Response } from 'express';
import SuperTokens from 'supertokens-node';
import type { RecipeUserId } from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import { Role } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly users: UsersService) {}

  async login(email: string, password: string, req?: Request, res?: Response,) {
    const result = await EmailPassword.signIn('public', email.trim().toLowerCase(), password);

    if (result.status === 'WRONG_CREDENTIALS_ERROR') {
      return null;
    }

    const user = await this.users.syncSuperTokensUser({
      superTokensUserId: result.user.id,
      email: result.user.emails[0] ?? email,
      name: result.user.emails[0]?.split('@')[0],
    });
    await this.createSuperTokensSession(req, res, result.recipeUserId);
    return user;
  }

  async register(name: string, email: string, password: string, req?: Request, res?: Response,) {
    email = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new ConflictException('Пользователь с таким email уже существует');
    const result = await EmailPassword.signUp('public', email, password);

    if (result.status === 'EMAIL_ALREADY_EXISTS_ERROR') {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const user = await this.users.syncSuperTokensUser({ superTokensUserId: result.user.id, email, name: name.trim() });
    await this.createSuperTokensSession(req, res, result.recipeUserId);
    return user;
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

    return this.users.syncSuperTokensUser({
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

  private async createSuperTokensSession(
    req: Request | undefined,
    res: Response | undefined,
    recipeUserId: RecipeUserId,
  ) {
    if (!req || !res) {
      return;
    }

    req.headers['st-auth-mode'] = 'cookie';
    await Session.createNewSession(req, res, 'public', recipeUserId);
  }

  private async getOptionalSession(req: Request, res?: Response) {
    const checkDatabase = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    try {
      if (res) {
        return await Session.getSession(req, res, {
          sessionRequired: false,
          antiCsrfCheck: false,
          checkDatabase,
        });
      }

      const accessToken = this.getCookieValue(req, 'sAccessToken');

      if (!accessToken) {
        return undefined;
      }

      return await Session.getSessionWithoutRequestResponse(accessToken, undefined, {
          sessionRequired: false,
          antiCsrfCheck: false,
          checkDatabase,
        });
    } catch {
      return undefined;
    }
  }

  private getCookieValue(req: Request, name: string) {
    const rawValue = req.headers.cookie
      ?.split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`))
      ?.split('=')[1];

    return rawValue ? decodeURIComponent(rawValue) : undefined;
  }

  private clearSessionCookies(res: Response) {
    res.clearCookie('userId', { path: '/' });
    res.clearCookie('sAccessToken', { path: '/' });
    res.clearCookie('sRefreshToken', { path: '/' });
    res.clearCookie('sFrontToken', { path: '/' });
    res.clearCookie('sRefreshToken', { path: '/auth/session/refresh' });
  }
}