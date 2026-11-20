import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import SuperTokens, { convertToRecipeUserId } from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import { Prisma } from '../../generated/prisma/client.js';
import { hasPlus } from '../kino-plus/plus-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        plusAccess: { select: { endsAt: true } },
      },
    });
    if (!user) throw new NotFoundException('Профиль не найден');
    const { plusAccess, ...profile } = user;
    return { ...profile, plusActive: hasPlus(plusAccess) };
  }

  async updateCurrentProfile(userId: number, form: UpdateProfileDto) {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, superTokensUserId: true },
    });
    if (!current) throw new NotFoundException('Профиль не найден');
    const email = form.email?.trim().toLowerCase();

    try {
      await this.prisma.$transaction(
        async (tx) => {
          const user = await tx.user.update({
            where: { id: userId },
            data: { name: form.name?.trim(), email },
            select: { superTokensUserId: true },
          });

          if (email && email !== current.email && user.superTokensUserId) {
            const result = await EmailPassword.updateEmailOrPassword({
              recipeUserId: convertToRecipeUserId(user.superTokensUserId),
              email,
            });
            if (result.status === 'EMAIL_ALREADY_EXISTS_ERROR')
              throw new ConflictException('Эта почта уже используется');
            if (result.status !== 'OK')
              throw new ServiceUnavailableException(
                'Не удалось обновить email для входа',
              );
          }
        },
        { timeout: 15000 },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Эта почта уже используется');
      }
      throw error;
    }
    return this.getCurrentProfile(userId);
  }

  async removeProfile(userId: number) {
    await this.prisma.$transaction(
      async (tx) => {
        const { superTokensUserId } = await tx.user.delete({
          where: { id: userId },
          select: { superTokensUserId: true },
        });
        if (superTokensUserId) {
          await Session.revokeAllSessionsForUser(superTokensUserId);
          await SuperTokens.deleteUser(superTokensUserId);
        }
      },
      { timeout: 15000 },
    );
  }
}
