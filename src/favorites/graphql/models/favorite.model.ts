import { Field, Int, ObjectType } from '@nestjs/graphql';
import { FavoriteMovieModel } from './favorite-movie.model';

@ObjectType({ description: 'Запись избранного' })
export class FavoriteModel {
  @Field(() => Int, { description: 'id записи избранного' })
  id: number;

  @Field(() => FavoriteMovieModel, { description: 'Фильм в избранном' })
  movie: FavoriteMovieModel;
}