import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ReviewUserModel } from './review-user.model';
import { ReviewMovieModel } from './review-movie.model';

@ObjectType({ description: 'Отзыв' })
export class ReviewModel {
  @Field(() => Int, { description: 'id отзыва' })
  id: number;

  @Field(() => Int, { description: 'Оценка фильма' })
  rating: number;

  @Field({ description: 'Текст отзыва' })
  comment: string;

  @Field(() => ReviewUserModel, { description: 'Пользователь, оставивший отзыв' })
  user: ReviewUserModel;

  @Field(() => ReviewMovieModel, { description: 'Фильм, к которому относится отзыв' })
  movie: ReviewMovieModel;
}