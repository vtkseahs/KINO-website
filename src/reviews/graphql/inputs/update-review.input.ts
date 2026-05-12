import { Field, InputType, Int } from '@nestjs/graphql';

@InputType({ description: 'обновление отзыва' })
export class UpdateReviewInput {
  @Field(() => Int, { nullable: true, description: 'Оценка фильма' })
  rating?: number;

  @Field({ nullable: true, description: 'Текст отзыва' })
  comment?: string;

  @Field(() => Int, { nullable: true, description: 'id фильма' })
  movieId?: number;
}