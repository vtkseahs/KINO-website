import { Field, InputType, Int } from '@nestjs/graphql';

@InputType({ description: 'Данные для создания отзыва' })
export class CreateReviewInput {
  @Field(() => Int, { description: 'Оценка фильма' })
  rating: number;

  @Field({ description: 'Текст отзыва' })
  comment: string;

  @Field(() => Int, { description: 'id фильма' })
  movieId: number;
}