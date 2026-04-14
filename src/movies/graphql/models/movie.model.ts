import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GenreModel } from './genre.model';

@ObjectType({ description: 'Фильм' })
export class MovieModel {
  @Field(() => Int, { description: 'id фильма' })
  id: number;

  @Field({ description: 'Название фильма' })
  title: string;

  @Field({ description: 'Описание фильма' })
  description: string;

  @Field(() => Int, { description: 'Год выпуска' })
  year: number;

  @Field(() => Int, { description: 'Длительность в минутах' })
  duration: number;

  @Field({ description: 'Возрастной рейтинг' })
  ageRating: string;

  @Field(() => String, { nullable: true, description: 'Ссылка на постер' })
  posterUrl?: string | null;

  @Field({ description: 'Дата создания фильма' })
  createdAt: Date;

  @Field({ description: 'Дата последнего обновления фильма' })
  updatedAt: Date;

  @Field(() => Int, { description: 'id жанра' })
  genreId: number;

  @Field(() => GenreModel, { description: 'Жанр фильма' })
  genre: GenreModel;
}