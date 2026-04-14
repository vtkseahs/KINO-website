import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ReviewsService } from '../reviews.service';
import { ReviewModel } from './models/review.model';
import { ReviewsPageModel } from './models/reviews-page.model';
import { CreateReviewInput } from './inputs/create-review.input';
import { UpdateReviewInput } from './inputs/update-review.input';
import { ReviewsPaginationInput } from './inputs/reviews-pagination.input';

@Resolver(() => ReviewModel)
export class ReviewsResolver {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Query(() => ReviewsPageModel, {
    name: 'reviews',
    description: 'Получить список отзывов',
  })
  async findAll(
    @Args('pagination', { nullable: true }) pagination?: ReviewsPaginationInput) {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;

    return this.reviewsService.findAllPaginated(page, limit);
  }

  @Query(() => ReviewModel, {
    name: 'review',
    description: 'Получить отзыв по id',
  })
  async findOne(
    @Args('id', { type: () => Int }) id: number) {
    return this.reviewsService.findOne(id);
  }

  @Mutation(() => ReviewModel, {
    name: 'createReview',
    description: 'Создать отзыв',
  })
  async create(
    @Args('input') input: CreateReviewInput) {
    return this.reviewsService.createForUser(input, input.userId);
  }

  @Mutation(() => ReviewModel, {
    name: 'updateReview',
    description: 'Обновить отзыв',
  })
  async update(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateReviewInput) {
    return this.reviewsService.update(id, input, input.userId);
  }

  @Mutation(() => Boolean, {
    name: 'removeReview',
    description: 'Удалить отзыв',
  })
  async remove(
    @Args('id', { type: () => Int }) id: number,
    @Args('userId', { type: () => Int }) userId: number) {
    await this.reviewsService.remove(id, userId);
    return true;
  }
}