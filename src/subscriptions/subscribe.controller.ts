import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, Res, Query, } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiExcludeController } from '@nestjs/swagger';

import { buildRecommendations, moodOptions, runtimeOptions } from './recommendations';

@ApiExcludeController()
@Controller('subscribe')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService, private readonly authService: AuthService, private readonly prisma: PrismaService,) {}

  @Get()
  async getSubscriptionsPage(@Req() req: Request, @Res() res: Response, @Query('period') period = '30', @Query('mood') mood = '', @Query('result') result = '', @Query('runtime') runtime = '', @Query('pick') pick = '') {
    const auth = await this.authService.getAuthData(req);
    const days = ['7', '30', '90', '365'].includes(period) ? Number(period) : 30;
    const base = { ...auth, title: 'КИНО Plus', failed: result === 'failed' };
    if (!auth.user) return res.render('subscribe', base);

    const userId = auth.user.id;
    const subscription = await this.subscriptionsService.getCurrentUserSubscription(userId);
    const active = subscription.plan?.title === 'КИНО Plus'
      && subscription.endsAt && subscription.endsAt > new Date();
    if (!active) return res.render('subscribe', base);

    const since = new Date(Date.now() - days * 86400000);
    const interaction = { movie: { include: { genre: true } } } as const;
    const [favorites, reviews, views, movies] = await Promise.all([
      this.prisma.favorite.findMany({ where: { userId }, include: interaction }),
      this.prisma.review.findMany({ where: { userId }, include: interaction }),
      this.prisma.movieView.findMany({ where: { userId }, include: interaction }),
      this.prisma.movie.findMany({ include: { genre: true, _count: { select: { reviews: true } } } }),
    ]);
    const plus = buildRecommendations(movies, favorites, reviews, views, mood, runtime, pick === '1');
    const periodViews = views.filter(view => view.viewedAt >= since);
    const genreCounts = new Map<string, { name: string; count: number }>();
    for (const { movie } of periodViews) {
      const name = movie.genre.name.trim();
      const key = name.toLocaleLowerCase('ru-RU');
      genreCounts.set(key, { name, count: (genreCounts.get(key)?.count ?? 0) + 1 });
    }
    const ratingCounts = new Map<number, number>();
    for (const { rating, createdAt } of reviews) {
      if (createdAt >= since) ratingCounts.set(rating, (ratingCounts.get(rating) ?? 0) + 1);
    }

    return res.render('subscribe', {
      ...base, ...plus, active: true, activated: result === 'success', period: days, moodOptions, runtimeOptions,
      viewCount: periodViews.length,
      uniqueViewCount: new Set(periodViews.map(view => view.movieId)).size,
      genres: [...genreCounts.values()].sort((a, b) => b.count - a.count),
      ratings: [...ratingCounts.entries()].sort(([a], [b]) => b - a).map(([rating, count]) => ({ rating, count })),
    });
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