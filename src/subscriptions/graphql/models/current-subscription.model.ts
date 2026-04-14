import { Field, ObjectType } from '@nestjs/graphql';
import { SubscriptionPlanModel } from './subscription-plan.model';

@ObjectType({ description: 'Текущая подписка пользователя' })
export class CurrentSubscriptionModel {
  @Field(() => SubscriptionPlanModel, {
    nullable: true,
    description: 'Активная подписка пользователя',
  })
  plan: SubscriptionPlanModel | null;

  @Field(() => Date, {
    nullable: true,
    description: 'Дата окончания подписки',
  })
  endsAt: Date | null;
}