import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Тариф подписки' })
export class SubscriptionPlanModel {
  @Field(() => Int, { description: 'id тарифа' })
  id: number;

  @Field({ description: 'Название тарифа' })
  title: string;

  @Field({ description: 'Описание тарифа' })
  description: string;

  @Field(() => Int, { description: 'Стоимость тарифа' })
  price: number;

  @Field(() => Int, { description: 'Срок действия тарифа' })
  durationDays: number;

  @Field({ description: 'Дата создания' })
  createdAt: Date;
}