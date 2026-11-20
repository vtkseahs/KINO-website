import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';

const userSelect = { id: true, email: true, name: true, role: true } as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySuperTokensUserId(superTokensUserId: string | undefined) {
    if (!superTokensUserId) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    const user = await this.prisma.user.findFirst({
      where: { superTokensUserId }, select: userSelect,
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не связан с локальным аккаунтом');
    }

    return user;
  }

  async syncSuperTokensUser(params: {
    superTokensUserId: string;
    email: string;
    name?: string;
  }) {
    const existingBySuperTokensId = await this.prisma.user.findUnique({
      where: { superTokensUserId: params.superTokensUserId }, select: userSelect,
    });

    if (existingBySuperTokensId) {
      return existingBySuperTokensId;
    }

    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: params.email },
    });

    if (existingByEmail) {
      throw new ConflictException('Почта уже связана с другим локальным профилем');
    }

    return this.prisma.user.upsert({
      where: { superTokensUserId: params.superTokensUserId },
      select: userSelect,
      update: {},
      create: {
        email: params.email,
        name: params.name || params.email.split('@')[0],
        password: '',
        role: Role.USER,
        superTokensUserId: params.superTokensUserId,
      },
    });
  }
}