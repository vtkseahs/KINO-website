import { Field, InputType, Int } from '@nestjs/graphql';

@InputType({ description: 'Данные для добавления фильма в избранное' })
export class CreateFavoriteInput {
  @Field(() => Int, { description: 'id фильма' })
  movieId: number;

  @Field(() => Int, { description: 'id пользователя' })
  userId: number;
}