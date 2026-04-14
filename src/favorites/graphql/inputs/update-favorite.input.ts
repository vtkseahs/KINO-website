import { Field, InputType, Int } from '@nestjs/graphql';

@InputType({ description: 'Данные для обновления записи избранного' })
export class UpdateFavoriteInput {
  @Field(() => Int, { description: 'id фильма' })
  movieId: number;

  @Field(() => Int, { description: 'id пользователя' })
  userId: number;
}