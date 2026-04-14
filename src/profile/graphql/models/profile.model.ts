import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProfileSubscriptionPlanModel } from './profile-subscription-plan.model';

@ObjectType({ description: 'Профиль пользователя' })
export class ProfileModel {
  @Field(() => Int, { description: 'id пользователя' })
  id: number;

  @Field({ description: 'почта пользователя' })
  email: string;

  @Field({ description: 'имя пользователя' })
  name: string;

  @Field({ description: 'роль' })
  role: string;

  @Field(() => String, { description: 'Дата регистрации' })
  createdAt: Date;

  @Field(() => String, {
    nullable: true,
    description: 'Дата окончания подписки',
  })
  subscriptionEndsAt: Date | null;

  @Field(() => ProfileSubscriptionPlanModel, {
    nullable: true,
    description: 'Текущая подписка пользователя',
  })
  subscriptionPlan: ProfileSubscriptionPlanModel | null;
}