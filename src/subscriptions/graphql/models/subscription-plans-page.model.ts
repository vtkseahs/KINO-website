import { Field, Int, ObjectType } from '@nestjs/graphql';
import { SubscriptionPlanModel } from './subscription-plan.model';

@ObjectType({ description: 'Страница тарифов подписки' })
export class SubscriptionPlansPageModel {
  @Field(() => Int, { description: 'Текущая стр' })
  page: number;

  @Field(() => Int, { description: 'Размер стр' })
  limit: number;

  @Field(() => Int, { description: 'Общее количество тарифов' })
  total: number;

  @Field(() => [SubscriptionPlanModel], { description: 'Список тарифов' })
  data: SubscriptionPlanModel[];
}