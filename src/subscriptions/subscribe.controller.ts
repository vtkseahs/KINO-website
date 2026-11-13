import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, Res, Query, } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiExcludeController } from '@nestjs/swagger';

type CurrentSubscription = {
  plan: {
    id: number;
    title: string;
    description: string;
    price: number;
    durationDays: number;
    createdAt: Date;
  } | null;
  endsAt: Date | null;
};

@ApiExcludeController()
@Controller('subscribe')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService, private readonly authService: AuthService, private readonly prisma: PrismaService,) {}

  @Get()
  async getSubscriptionsPage(@Req() req: Request, @Res() res: Response, @Query('period') period = '30', @Query('mood') mood = '', @Query('result') result = '') {
    const auth = await this.authService.getAuthData(req);
    let active = false;
    let recommendations: any[] = [], collections: any[] = [], genres: any[] = [], ratings: any[] = [];
    let viewCount = 0;
    const days = ['7', '30', '90', '365'].includes(period) ? Number(period) : 30;
    const moods: Record<string, string[]> = { light: ['комедия', 'мультфильм', 'семейный'], exciting: ['боевик', 'приключения', 'триллер'], thoughtful: ['драма', 'фантастика', 'документальный'] };
    if (auth.user) {
      const subscription = await this.subscriptionsService.getCurrentUserSubscription(auth.user.id);
      active = subscription.plan?.title === 'КИНО Plus' && !!subscription.endsAt && subscription.endsAt > new Date();
      if (active) {
        const since = new Date(Date.now() - days * 86400000);
        const [favorites, reviews, views, movies] = await Promise.all([
          this.prisma.favorite.findMany({ where: { userId: auth.user.id }, include: { movie: { include: { genre: true } } } }),
          this.prisma.review.findMany({ where: { userId: auth.user.id }, include: { movie: { include: { genre: true } } } }),
          this.prisma.movieView.findMany({ where: { userId: auth.user.id }, include: { movie: { include: { genre: true } } } }),
          this.prisma.movie.findMany({ include: { genre: true }, orderBy: { id: 'asc' } }),
        ]);
        const weights = new Map<number, number>();
        const known = new Set<number>();
        for (const item of favorites) { weights.set(item.movie.genreId, (weights.get(item.movie.genreId) || 0) + 3); known.add(item.movieId); }
        for (const item of reviews) { weights.set(item.movie.genreId, (weights.get(item.movie.genreId) || 0) + Math.max(0, item.rating - 5)); known.add(item.movieId); }
        for (const item of views) { weights.set(item.movie.genreId, (weights.get(item.movie.genreId) || 0) + 1); known.add(item.movieId); }
        const ranked = [...movies].sort ( (a, b) => (weights.get(b.genreId) || 0) - (weights.get(a.genreId) || 0));
        recommendations = ranked.filter(movie => !known.has(movie.id)).slice(0, 8);
        if (mood && moods[mood]) recommendations = ranked.filter(movie => moods[mood].some(g => movie.genre.name.toLowerCase().includes(g))).slice(0, 8);
        const topGenreIds = [...weights.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);
        collections = topGenreIds.map(id => ({ name: movies.find(m => m.genreId === id)?.genre.name, movies: ranked.filter(m => m.genreId === id).slice(0, 6) }));
        const periodViews = views.filter(v => v.viewedAt >= since);
        viewCount = periodViews.length;
        const genreCounts = new Map<string, number>();
        for (const item of periodViews) genreCounts.set(item.movie.genre.name, (genreCounts.get(item.movie.genre.name) || 0) + 1);
        genres = [...genreCounts].map(([name, count]) => ({ name, count }));
        const ratingCounts = new Map<number, number>();
        for (const item of reviews.filter(r => r.createdAt >= since)) ratingCounts.set(item.rating, (ratingCounts.get(item.rating) || 0) + 1);
        ratings = [...ratingCounts].sort((a, b) => b[0] - a[0]).map(([rating, count]) => ({ rating, count }));
      }
    }
    return res.render('subscribe', { ...auth, title: 'КИНО Plus', active, recommendations, collections, genres, ratings, viewCount, period: days, mood, result, failed: result === 'failed', activated: result === 'success' });
  }

  @Post('activate')
  async activate(@Req() req: Request, @Res() res: Response, @Body('result') result: string) {
    const user = await this.authService.requireUser(req);
    if (result !== 'success') return res.redirect('/subscribe?result=failed');
    let plan = await this.prisma.subscriptionPlan.findFirst({ where: { title: 'КИНО Plus' } });
    if (!plan) plan = await this.prisma.subscriptionPlan.create({ data: { title: 'КИНО Plus', description: 'Тестовый доступ к персональным функциям', price: 0, durationDays: 365 } });
    await this.subscriptionsService.buyPlan(plan.id, user.id);
    return res.redirect('/subscribe?result=success');
  }

  @Get('add')
  async getAddPlanPage(@Req() req: Request, @Res() res: Response) {
    await this.authService.requireAdmin(req);
    const auth = await this.authService.getAuthData(req);

    return res.render('subscription-form', {
      ...auth,
      title: 'Добавить тариф',
      plan: null,
      formAction: '/subscribe/add',
      isEdit: false,
    });
  }

  @Post('add')
  async createPlan(
    @Req() req: Request,
    @Body() dto: CreateSubscriptionPlanDto,
    @Res() res: Response,
  ) {
    await this.authService.requireAdmin(req);
    const plan = await this.subscriptionsService.createPlan(dto);
    return res.redirect(`/subscribe/${plan.id}`);
  }

  @Get(':id')
  async getPlanPage(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const auth = await this.authService.getAuthData(req);
    const plan = await this.subscriptionsService.findPlan(id);

    return res.render('subscription', {
      ...auth,
      title: plan.title,
      plan,
    });
  }

  @Get(':id/edit')
  async getEditPlanPage(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.authService.requireAdmin(req);
    const auth = await this.authService.getAuthData(req);

    const plan = await this.subscriptionsService.findPlan(id);

    return res.render('subscription-form', {
      ...auth,
      title: `Редактировать тариф: ${plan.title}`,
      plan,
      formAction: `/subscribe/${plan.id}/edit`,
      isEdit: true,
    });
  }

  @Post(':id/edit')
  async updatePlan(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionPlanDto,
    @Res() res: Response,
  ) {
    await this.authService.requireAdmin(req);
    await this.subscriptionsService.updatePlan(id, dto);
    return res.redirect(`/subscribe/${id}`);
  }

  @Post(':id/delete')
  async deletePlan(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    await this.authService.requireAdmin(req);
    await this.subscriptionsService.removePlan(id);
    return res.redirect('/subscribe');
  }

  @Post(':id/buy')
  async buyPlan(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const currentUser = await this.authService.requireUser(req);
    await this.subscriptionsService.buyPlan(id, currentUser.id);
    return res.redirect('/subscribe');
  }

  @Post('cancel')
  async cancelSubscription(@Req() req: Request, @Res() res: Response) {
    const currUser = await this.authService.requireUser(req);
    await this.subscriptionsService.cancelSubscription(currUser.id);
    return res.redirect('/subscribe');
  }
}