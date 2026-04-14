import { Field, Int, ObjectType } from '@nestjs/graphql';
import { FavoriteModel } from './favorite.model';

@ObjectType({ description: 'Страница избранного' })
export class FavoritesPageModel {
  @Field(() => Int, { description: 'Текущая страница' })
  page: number;

  @Field(() => Int, { description: 'Размер страницы' })
  limit: number;

  @Field(() => Int, { description: 'Общее количество записей' })
  total: number;

  @Field(() => [FavoriteModel], { description: 'Список записей избранного' })
  data: FavoriteModel[];
}