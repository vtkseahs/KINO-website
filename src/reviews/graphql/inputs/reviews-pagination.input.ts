import { Field, InputType, Int } from '@nestjs/graphql';

@InputType({ description: 'Ппагинация отзывов' })
export class ReviewsPaginationInput {
  @Field(() => Int, {
    nullable: true,
    defaultValue: 1,
    description: 'Номер стр',
  })
  page?: number;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 10,
    description: 'Количество элементов на стр',
  })
  limit?: number;
}