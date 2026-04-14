import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Фильм, к которому относится отзыв' })
export class ReviewMovieModel {
  @Field(() => Int, { description: 'id фильма' })
  id: number;

  @Field({ description: 'Название фильма' })
  title: string;
}