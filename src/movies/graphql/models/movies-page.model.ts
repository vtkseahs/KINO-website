import { Field, Int, ObjectType } from '@nestjs/graphql';
import { MovieModel } from './movie.model';

@ObjectType({ description: 'Страница фильмов' })
export class MoviesPageModel {
  @Field(() => Int, { description: 'Текущая страница' })
  page: number;

  @Field(() => Int, { description: 'Размер страницы' })
  limit: number;

  @Field(() => Int, { description: 'Общее количество фильмов' })
  total: number;

  @Field(() => [MovieModel], { description: 'Список фильмов' })
  data: MovieModel[];
}