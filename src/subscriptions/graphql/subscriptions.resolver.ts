import { Args, Int, Mutation, Query, Resolver, Context} from '@nestjs/graphql';
import { SubscriptionsService } from '../subscriptions.service';
import { SubscriptionPlanModel } from './models/subscription-plan.model';
import { SubscriptionPlansPageModel } from './models/subscription-plans-page.model';
import { CurrentSubscriptionModel } from './models/current-subscription.model';
import { CreateSubscriptionPlanInput } from './inputs/create-subscription-plan.input';
import { UpdateSubscriptionPlanInput } from './inputs/update-subscription-plan.input';
import { SubscriptionsPaginationInput } from './inputs/subscriptions-pagination.input';
import { UseGuards } from '@nestjs/common';
import { Role } from '../../../generated/prisma/client.js';
import { SuperTokensAuthGuard } from '../../st-auth/guards/st-auth.guard';
import { Roles } from '../../st-auth/decorators/roles.decorator';
import { UsersService } from '../../users/users.service';
import type { StRequest } from '../../st-auth/types/st-request';

@Resolver(() => SubscriptionPlanModel)
export class SubscriptionsResolver {
  constructor(private readonly subscriptionsService: SubscriptionsService, private readonly usersService: UsersService,) {}

  @Query(() => SubscriptionPlansPageModel, {
    name: 'get_all_subscriptionPlans',
    description: 'Получить список тарифов',
  })
  async findAll(
    @Args('pagination', { nullable: true })
    pagination?: SubscriptionsPaginationInput,
  ) {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;

    return this.subscriptionsService.findAllPlansPaginated(page, limit);
  }

  @Query(() => SubscriptionPlanModel, {
    name: 'get_one_subscriptionPlan',
    description: 'Получить тариф по id',
  })
  async findOne(
    @Args('id', { type: () => Int }) id: number,
  ) {
    return this.subscriptionsService.findPlan(id);
  }

  @UseGuards(SuperTokensAuthGuard)
  @Query(() => CurrentSubscriptionModel, {
    name: 'currentSubscription',
    description: 'Получить текущую подписку пользователя',
  })
  async getCurrentSubscription(@Context('req') req: StRequest){
    const user = await this.usersService.findBySuperTokensUserId(req.superTokensUserId);
    return this.subscriptionsService.getCurrentUserSubscription(user.id);
  }

  @UseGuards(SuperTokensAuthGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => SubscriptionPlanModel, {
    name: 'createSubscriptionPlan',
    description: 'Создать тариф',
  })
  async create(
    @Args('input') input: CreateSubscriptionPlanInput,
  ) {
    return this.subscriptionsService.createPlan(input);
  }

  @UseGuards(SuperTokensAuthGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => SubscriptionPlanModel, {
    name: 'updateSubscriptionPlan',
    description: 'Обновить тариф',
  })
  async update(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateSubscriptionPlanInput,
  ) {
    return this.subscriptionsService.updatePlan(id, input);
  }

  @UseGuards(SuperTokensAuthGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => Boolean, {
    name: 'removeSubscriptionPlan',
    description: 'Удалить тариф',
  })
  async remove(
    @Args('id', { type: () => Int }) id: number,
  ) {
    await this.subscriptionsService.removePlan(id);
    return true;
  }

  @UseGuards(SuperTokensAuthGuard)
  @Mutation(() => SubscriptionPlanModel, {
    name: 'buySubscription',
    description: 'Оформить подписку на тариф',
  })
  async buySubscription(@Context('req') req: StRequest, @Args('planId', { type: () => Int }) planId: number) {
    const user = await this.usersService.findBySuperTokensUserId(
      req.superTokensUserId,
    );

    return this.subscriptionsService.buyPlan(planId, user.id);
  }

  @UseGuards(SuperTokensAuthGuard)
  @Mutation(() => Boolean, {
    name: 'cancelSubscription',
    description: 'Отменить текущую подписку пользователя',
  })
  async cancelSubscription(@Context('req') req: StRequest) {
    const user = await this.usersService.findBySuperTokensUserId(
      req.superTokensUserId,
    );
    await this.subscriptionsService.cancelSubscription(user.id);
    return true;
  }
}