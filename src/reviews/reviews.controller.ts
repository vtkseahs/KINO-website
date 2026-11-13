import { Body, Controller, Get, Param, Post, Req, Render, Res, ParseIntPipe } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DiscussionsService } from './discussions.service';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AuthService } from '../auth/auth.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService, private readonly authService: AuthService, private readonly discussions: DiscussionsService,) {}

  @Get()
  @Render('reviews')
  async getReviewsPage(@Req() req: Request) {
    const auth = await this.authService.getAuthData(req);
    const movies = await this.reviewsService.findDiscussionMovies();
    return { ...auth, title: 'Обсуждения фильмов', movies };
  }

  @Get('movie/:movieId')
  @Render('discussion')
  async getMovieDiscussion(@Req() req: Request, @Param('movieId', ParseIntPipe) movieId: number) {
    const auth = await this.authService.getAuthData(req);
    const movie = await this.reviewsService.findMovieDiscussion(movieId);
    const discussion = await this.discussions.list(movieId, auth.user?.id);
    return {
      ...auth,
      title: `Обсуждение: ${movie.title}`,
      movie,
      threads: discussion.threads,
      postCount: discussion.count,
      reviews: movie.reviews.map(review => ({ ...review, canManage: review.userId === auth.user?.id })),
      ownReview: movie.reviews.some(review => review.userId === auth.user?.id),
    };
  }

  @Post('movie/:movieId/posts')
  async createPost(@Req() req: Request, @Res() res: Response, @Param('movieId', ParseIntPipe) movieId: number, @Body('content') content: string, @Body('parentId') parentId?: string) {
    const user = await this.authService.requireUser(req);
    await this.discussions.create(movieId, user.id, content, parentId);
    return res.redirect(`/reviews/movie/${movieId}#discussion`);
  }

  @Post('movie/:movieId/posts/:postId/like')
  async likePost(@Req() req: Request, @Res() res: Response, @Param('movieId', ParseIntPipe) movieId: number, @Param('postId', ParseIntPipe) postId: number) {
    const user = await this.authService.requireUser(req);
    await this.discussions.toggleLike(movieId, postId, user.id);
    return res.redirect(`/reviews/movie/${movieId}#post-${postId}`);
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

    return res.redirect(`/reviews/movie/${review.movieId}`);
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
    if (!auth.user) return res.redirect('/auth/login');

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
    const review = await this.reviewsService.update(id, updateReviewDto, currentUser.id);
    return res.redirect(`/reviews/movie/${review.movieId}`);
  }

  @Post(':id/delete')
  async deleteReview(
    @Req() req: Request,
    @Param('id',ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const currentUser = await this.authService.requireUser(req);
    const review = await this.reviewsService.remove(id, currentUser.id);
    return res.redirect(`/reviews/movie/${review.movieId}`);
  }
}