import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Жанр фильма' })
export class GenreModel {
  @Field(() => Int, { description: 'id жанра' })
  id: number;

  @Field({ description: 'Название жанра' })
  name: string;

  @Field({ description: 'Дата создания жанра' })
  createdAt: Date;
}