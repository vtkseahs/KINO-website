import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
    });
  }

  async findPlan(id: number) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Тариф с id=${id} не найден`);
    }

    return plan;
  }

  async createPlan(dto: CreateSubscriptionPlanDto) {
    return this.prisma.subscriptionPlan.create({
      data: {
        title: dto.title,
        description: dto.description,
        price: Number(dto.price),
        durationDays: Number(dto.durationDays),
      },
    });
  }

  async updatePlan(id: number, dto: UpdateSubscriptionPlanDto) {
    await this.findPlan(id);

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price !== undefined ? Number(dto.price) : undefined,
        durationDays:
          dto.durationDays !== undefined ? Number(dto.durationDays) : undefined,
      },
    });
  }

  async removePlan(id: number) {
    await this.findPlan(id);

    return this.prisma.subscriptionPlan.delete({
      where: { id },
    });
  }

  async buyPlan(planId: number, userId: number) {
    const plan = await this.findPlan(planId);

    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + plan.durationDays);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlanId: plan.id,
        subscriptionEndsAt: endsAt,
      },
    });

    return plan;
  }

  async getCurrentUserSubscription(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptionPlan: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с id=${userId} не найден`);
    }

    return {
      plan: user.subscriptionPlan,
      endsAt: user.subscriptionEndsAt,
    };
  }

  async cancelSubscription(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlanId: null,
        subscriptionEndsAt: null,
      },
    });
  }
}