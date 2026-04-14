import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Жанр фильма в избранном' })
export class FavoriteGenreModel {
  @Field(() => Int, { description: 'id жанра' })
  id: number;

  @Field({ description: 'Название жанра' })
  name: string;
}