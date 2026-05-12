import { Args, Int, Mutation, Query, Resolver, Context } from '@nestjs/graphql';
import { ReviewsService } from '../reviews.service';
import { ReviewModel } from './models/review.model';
import { ReviewsPageModel } from './models/reviews-page.model';
import { CreateReviewInput } from './inputs/create-review.input';
import { UpdateReviewInput } from './inputs/update-review.input';
import { ReviewsPaginationInput } from './inputs/reviews-pagination.input';
import { UseGuards } from '@nestjs/common';
import { SuperTokensAuthGuard } from '../../st-auth/guards/st-auth.guard';
import { UsersService } from '../../users/users.service';
import type { StRequest } from '../../st-auth/types/st-request';

@Resolver(() => ReviewModel)
export class ReviewsResolver {
  constructor(private readonly reviewsService: ReviewsService, private readonly usersService: UsersService) {}

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

  @UseGuards(SuperTokensAuthGuard)
  @Mutation(() => ReviewModel, {
    name: 'createReview',
    description: 'Создать отзыв',
  })
  async create(@Context('req') req: StRequest, @Args('input') input: CreateReviewInput) {
    const user = await this.usersService.findBySuperTokensUserId(
      req.superTokensUserId,
    );

    return this.reviewsService.createForUser(input, user.id);
  }

  @UseGuards(SuperTokensAuthGuard)
  @Mutation(() => ReviewModel, {
    name: 'updateReview',
    description: 'Обновить отзыв',
  })
  async update(@Context('req') req: StRequest, @Args('id', { type: () => Int }) id: number, @Args('input') input: UpdateReviewInput) {
    const user = await this.usersService.findBySuperTokensUserId(
      req.superTokensUserId,
    );

    return this.reviewsService.update(id, input, user.id);
  }

  @UseGuards(SuperTokensAuthGuard)
  @Mutation(() => Boolean, {
    name: 'removeReview',
    description: 'Удалить отзыв',
  })
  async remove(@Context('req') req: StRequest, @Args('id', { type: () => Int }) id: number) {
    const user = await this.usersService.findBySuperTokensUserId(
      req.superTokensUserId,
    );

    await this.reviewsService.remove(id, user.id);
    return true;
  }
}