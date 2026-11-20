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

  @Field(() => [String], { description: 'Актёры' })
  actors: string[];

  @Field(() => [String], { description: 'Режиссёры' })
  directors: string[];

  @Field(() => String, { nullable: true, description: 'Франшиза' })
  franchise: string | null;

  @Field(() => Date, { nullable: true, description: 'Дата премьеры' })
  premiereOn: Date | null;

  @Field({ description: 'Отметка о необычном кино' })
  unusual: boolean;

  @Field(() => [String], { description: 'Ссылки на онлайн-кинотеатры' })
  watchLinks: string[];

  @Field({ description: 'Дата создания фильма' })
  createdAt: Date;

  @Field({ description: 'Дата последнего обновления фильма' })
  updatedAt: Date;

  @Field(() => Int, { description: 'id жанра' })
  genreId: number;

  @Field(() => GenreModel, { description: 'Жанр фильма' })
  genre: GenreModel;
}