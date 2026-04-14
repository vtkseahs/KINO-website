import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'подписка в профиле пользователя' })
export class ProfileSubscriptionPlanModel {
  @Field(() => Int, { description: 'id подписки' })
  id: number;

  @Field({ description: 'Название подписки' })
  title: string;

  @Field({ description: 'Описание подписки' })
  description: string;

  @Field(() => Int, { description: 'Стоимость подписки' })
  price: number;

  @Field(() => Int, { description: 'Длительность подписки' })
  durationDays: number;
}