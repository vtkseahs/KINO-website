import { Field, InputType, Int } from '@nestjs/graphql';

@InputType({ description: 'создание подписки' })
export class CreateSubscriptionPlanInput {
  @Field({ description: 'Название подписки' })
  title: string;

  @Field({ description: 'Описание подписки' })
  description: string;

  @Field(() => Int, { description: 'Стоимость подписки' })
  price: number;

  @Field(() => Int, { description: 'Срок действия подписки' })
  durationDays: number;
}