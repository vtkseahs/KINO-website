import { Field, InputType, Int } from '@nestjs/graphql';

@InputType({ description: 'Данные для создания фильма' })
export class CreateMovieInput {
  @Field({ description: 'Название фильма' })
  title: string;

  @Field({ description: 'Описание фильма' })
  description: string;

  @Field(() => Int, { description: 'Год выпуска' })
  year: number;

  @Field(() => Int, { description: 'Длительность' })
  duration: number;

  @Field({ description: 'Возрастной рейтинг' })
  ageRating: string;

  @Field({ nullable: true, description: 'Ссылка на постер' })
  posterUrl?: string;

  @Field(() => Int, { description: 'id жанра' })
  genreId: number;
}