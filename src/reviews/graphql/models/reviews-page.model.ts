import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ReviewModel } from './review.model';

@ObjectType({ description: 'Страница отзывов' })
export class ReviewsPageModel {
  @Field(() => Int, { description: 'Текущая страница' })
  page: number;

  @Field(() => Int, { description: 'Размер страницы' })
  limit: number;

  @Field(() => Int, { description: 'Общее количество отзывов' })
  total: number;

  @Field(() => [ReviewModel], { description: 'Список отзывов' })
  data: ReviewModel[];
}