import { ForbiddenException, Injectable } from '@nestjs/common';
import { ActivationResult } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';

export function hasPlus(access: { endsAt: Date | null } | null): boolean {
  return Boolean(access?.endsAt && access.endsAt > new Date());
}

@Injectable()
export class PlusAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async isActive(userId: number) {
    return hasPlus(
      await this.prisma.plusAccess.findUnique({ where: { userId } }),
    );
  }

  async requireActive(userId: number) {
    if (!(await this.isActive(userId))) {
      throw new ForbiddenException(
        'Активируйте КИНО Plus для доступа к этой функции',
      );
    }
  }

  async activate(userId: number, result: ActivationResult) {
    const now = new Date();
    const activation =
      result === 'SUCCESS'
        ? {
            activatedAt: now,
            endsAt: new Date(now.getTime() + 365 * 86_400_000),
          }
        : {};
    const data = { ...activation, lastResult: result };
    await this.prisma.plusAccess.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async deactivate(userId: number) {
    await this.prisma.plusAccess.updateMany({
      where: { userId },
      data: { endsAt: null },
    });
  }
}
