import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Render,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @Render('reviews')
  async getReviewsPage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';
    const reviews = await this.reviewsService.findAll();

    return {
      title: 'Отзывы Kino',
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      reviews,
    };
  }

  @Get('add')
  @Render('review-form')
  async getAddReviewPage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';
    const movies = await this.reviewsService.findMovies();

    return {
      title: 'Добавить отзыв',
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      review: null,
      movies,
      formAction: '/reviews/add',
      isEdit: false,
    };
  }

  @Post('add')
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @Res() res: Response,
  ) {
    const review = await this.reviewsService.create(createReviewDto);
    return res.redirect(`/reviews/${review.id}`);
  }

  @Get(':id')
  @Render('review')
  async getReviewPage(@Param('id') id: string, @Query('auth') auth?: string) {
    const isAuth = auth === '1';
    const review = await this.reviewsService.findOne(Number(id));

    return {
      title: `Отзыв #${review.id}`,
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      review,
    };
  }

  @Get(':id/edit')
  @Render('review-form')
  async getEditReviewPage(
    @Param('id') id: string,
    @Query('auth') auth?: string,
  ) {
    const isAuth = auth === '1';
    const review = await this.reviewsService.findOne(Number(id));
    const movies = await this.reviewsService.findMovies();

    return {
      title: `Редактировать отзыв #${review.id}`,
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      review,
      movies,
      formAction: `/reviews/${review.id}/edit`,
      isEdit: true,
    };
  }

  @Post(':id/edit')
  async updateReview(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Res() res: Response,
  ) {
    await this.reviewsService.update(Number(id), updateReviewDto);
    return res.redirect(`/reviews/${id}`);
  }

  @Post(':id/delete')
  async deleteReview(@Param('id') id: string, @Res() res: Response) {
    await this.reviewsService.remove(Number(id));
    return res.redirect('/reviews');
  }
}