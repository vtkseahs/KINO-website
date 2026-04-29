import { Body, Controller, Get, Param, Post, Req, Render, Res, ParseIntPipe } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AuthService } from '../auth/auth.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService, private readonly authService: AuthService,) {}

  @Get()
  @Render('reviews')
  async getReviewsPage(@Req() req: Request) {
    const auth = await this.authService.getAuthData(req);
    const reviews = await this.reviewsService.findAll();

    return {
      ...auth,
      title: 'Отзывы Kino',
      reviews: reviews.map((review) => ({
        ...review,
        canManage: auth.user?.id === review.userId,
      })),
    };
  }

  @Get('add')
  async getAddReviewPage(@Req() req: Request, @Res() res: Response) {
    await this.authService.requireUser(req);
    const auth = await this.authService.getAuthData(req);

    const movies = await this.reviewsService.findMovies();

    return res.render('review-form', {
      ...auth,
      title: 'Добавить отзыв',
      review: null,
      movies,
      formAction: '/reviews/add',
      isEdit: false,
    });
  }

  @Post('add')
  async createReview(
    @Req() req: Request,
    @Body() createReviewDto: CreateReviewDto,
    @Res() res: Response,
  ) {
    const currentUser = await this.authService.requireUser(req);
    const review = await this.reviewsService.createForUser(
      createReviewDto,
      currentUser.id,
    );

    return res.redirect(`/reviews/${review.id}`);
  }

  @Get(':id')
  @Render('review')
  async getReviewPage(
    @Param('id',ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const auth = await this.authService.getAuthData(req);
    const review = await this.reviewsService.findOne(id);

    return {
      ...auth,
      title: `Отзыв #${review.id}`,
      review: {
        ...review,
        canManage: auth.user?.id === review.userId,
      },
    };
  }

  @Get(':id/edit')
  async getEditReviewPage(
    @Param('id',ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const auth = await this.authService.getAuthData(req);
    if (!auth || !auth.user) return;

    const review = await this.reviewsService.findOne(id);
    if (review.userId !== auth.user.id) {
      return res.redirect(`/reviews/${id}`);
    }
    const movies = await this.reviewsService.findMovies();

    return res.render('review-form', {
      ...auth,
      title: `Редактировать отзыв #${review.id}`,
      review,
      movies,
      formAction: `/reviews/${review.id}/edit`,
      isEdit: true,
    });
  }

  @Post(':id/edit')
  async updateReview(
    @Req() req: Request,
    @Param('id',ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto,
    @Res() res: Response,
  ) {
    const currentUser = await this.authService.requireUser(req);
    await this.reviewsService.update(id, updateReviewDto, currentUser.id);
    return res.redirect(`/reviews/${id}`);
  }

  @Post(':id/delete')
  async deleteReview(
    @Req() req: Request,
    @Param('id',ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const currentUser = await this.authService.requireUser(req);
    await this.reviewsService.remove(id, currentUser.id);
    return res.redirect('/reviews');
  }
}