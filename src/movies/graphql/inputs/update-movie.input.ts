import { Field, InputType, Int } from '@nestjs/graphql';

@InputType({ description: 'Данные для обновления фильма' })
export class UpdateMovieInput {
  @Field({ nullable: true, description: 'Название фильма' })
  title?: string;

  @Field({ nullable: true, description: 'Описание фильма' })
  description?: string;

  @Field(() => Int, { nullable: true, description: 'Год выпуска' })
  year?: number;

  @Field(() => Int, { nullable: true, description: 'Длительность в минутах' })
  duration?: number;

  @Field({ nullable: true, description: 'Возрастной рейтинг' })
  ageRating?: string;

  @Field(() => String, { nullable: true, description: 'Ссылка на постер' })
  posterUrl?: string | null;

  @Field(() => Int, { nullable: true, description: 'id жанра' })
  genreId?: number;
}