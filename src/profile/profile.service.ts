import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const DEMO_USER_ID = 1;

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentProfile() {
    const user = await this.prisma.user.findUnique({
      where: { id: DEMO_USER_ID },
    });

    if (!user) {
      throw new NotFoundException(
        `Пользователь с id=${DEMO_USER_ID} не найден`,
      );
    }
    return user;
  }

  async updateCurrentProfile(updateProfileDto: UpdateProfileDto) {
    await this.getCurrentProfile();

    return this.prisma.user.update({
      where: { id: DEMO_USER_ID },
      data: {
        name: updateProfileDto.name,
        email: updateProfileDto.email,
      },
    });
  }
}