import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SubscriptionsService } from '../subscriptions.service';
import { SubscriptionPlanModel } from './models/subscription-plan.model';
import { SubscriptionPlansPageModel } from './models/subscription-plans-page.model';
import { CurrentSubscriptionModel } from './models/current-subscription.model';
import { CreateSubscriptionPlanInput } from './inputs/create-subscription-plan.input';
import { UpdateSubscriptionPlanInput } from './inputs/update-subscription-plan.input';
import { SubscriptionsPaginationInput } from './inputs/subscriptions-pagination.input';

@Resolver(() => SubscriptionPlanModel)
export class SubscriptionsResolver {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

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

  @Query(() => CurrentSubscriptionModel, {
    name: 'currentSubscription',
    description: 'Получить текущую подписку пользователя',
  })
  async getCurrentSubscription(
    @Args('userId', { type: () => Int }) userId: number,
  ) {
    return this.subscriptionsService.getCurrentUserSubscription(userId);
  }

  @Mutation(() => SubscriptionPlanModel, {
    name: 'createSubscriptionPlan',
    description: 'Создать тариф',
  })
  async create(
    @Args('input') input: CreateSubscriptionPlanInput,
  ) {
    return this.subscriptionsService.createPlan(input);
  }

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

  @Mutation(() => SubscriptionPlanModel, {
    name: 'buySubscription',
    description: 'Оформить подписку на тариф',
  })
  async buySubscription(
    @Args('planId', { type: () => Int }) planId: number,
    @Args('userId', { type: () => Int }) userId: number,
  ) {
    return this.subscriptionsService.buyPlan(planId, userId);
  }

  @Mutation(() => Boolean, {
    name: 'cancelSubscription',
    description: 'Отменить текущую подписку пользователя',
  })
  async cancelSubscription(
    @Args('userId', { type: () => Int }) userId: number,
  ) {
    await this.subscriptionsService.cancelSubscription(userId);
    return true;
  }
}