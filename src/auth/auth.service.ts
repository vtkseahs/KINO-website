import { ConflictException, ForbiddenException, Injectable, UnauthorizedException, } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma, Role } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(login: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        password,
        OR: [
          { email: login },
          { name: login },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return user;
  }

  async register(name: string, email: string, password: string) {
    try {
      return await this.prisma.user.create({
        data: {
          name,
          email,
          password,
          role: Role.USER,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Пользователь с таким email уже существует');
      }

      throw error;
    }
  }

  async getCurrentUser(req: Request) {
    const rawUserId = req.headers.cookie
      ?.split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith('userId='))
      ?.split('=')[1];

    if (!rawUserId) {
      return null;
    }

    const userId = Number(rawUserId);

    if (!Number.isInteger(userId)) {
      return null;
    }

    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  async getAuthData(req: Request) {
    const user = await this.getCurrentUser(req);

    return {
      isAuth: !!user,
      isAdmin: user?.role === Role.ADMIN,
      user,
    };
  }

  async requireUser(req: Request) {
    const user = await this.getCurrentUser(req);

    if (!user) {
      throw new UnauthorizedException('Необходимо войти в аккаунт');
    }

    return user;
  }

  async requireAdmin(req: Request) {
    const user = await this.requireUser(req);

    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Недостаточно прав');
    }

    return user;
  }

  setUserCookie(res: Response, userId: number) {
    res.cookie('userId', String(userId), {
      path: '/',
    });
  }

  clearUserCookie(res: Response) {
    res.clearCookie('userId', {
      path: '/',
    });
  }
}