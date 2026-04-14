import { Field, Int, ObjectType } from '@nestjs/graphql';
import { FavoriteGenreModel } from './favorite-genre.model';

@ObjectType({ description: 'Фильм из избранного' })
export class FavoriteMovieModel {
  @Field(() => Int, { description: 'id фильма' })
  id: number;

  @Field({ description: 'Название фильма' })
  title: string;

  @Field({ description: 'Описание фильма' })
  description: string;

  @Field(() => Int, { description: 'Год выпуска' })
  year: number;

  @Field(() => Int, { description: 'Длительность фильма' })
  duration: number;

  @Field({ description: 'Возрастной рейтинг' })
  ageRating: string;

  @Field(() => String, { nullable: true, description: 'Постер фильма' })
  posterUrl?: string | null;

  @Field(() => FavoriteGenreModel, { description: 'Жанр фильма' })
  genre: FavoriteGenreModel;
}