import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Prisma } from '../../generated/prisma/client.js';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {subscriptionPlan: true},
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с id=${userId} не найден`,);
    }
    return user;
  }

  async updateCurrentProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    await this.getCurrentProfile(userId);

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: updateProfileDto.name !== undefined ? updateProfileDto.name : undefined,
          email: updateProfileDto.email!== undefined ? updateProfileDto.email : undefined,
        },
        include:{
          subscriptionPlan: true
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Пользователь с такой почтой уже существует');
      }
      throw error;
    }
  }
  async removeProfile(userId: number) {
    await this.getCurrentProfile(userId);
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
