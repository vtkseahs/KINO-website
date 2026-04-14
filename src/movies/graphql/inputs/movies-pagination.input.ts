import { Field, InputType, Int } from '@nestjs/graphql';

@InputType({ description: 'Параметры пагинации' })
export class MoviesPaginationInput {
  @Field(() => Int, {
    nullable: true,
    defaultValue: 1,
    description: 'Номер страницы',
  })
  page?: number;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 10,
    description: 'Количество элементов на странице',
  })
  limit?: number;
}