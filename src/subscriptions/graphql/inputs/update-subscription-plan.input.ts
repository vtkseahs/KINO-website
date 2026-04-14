import { Field, InputType, Int } from '@nestjs/graphql';

@InputType({ description: 'Данные для обновления подписки' })
export class UpdateSubscriptionPlanInput {
  @Field({ nullable: true, description: 'Название подписки' })
  title?: string;

  @Field({ nullable: true, description: 'Описание подписки' })
  description?: string;

  @Field(() => Int, { nullable: true, description: 'Стоимость подписки' })
  price?: number;

  @Field(() => Int, { nullable: true, description: 'Срок действия подписки' })
  durationDays?: number;
}