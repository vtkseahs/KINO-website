import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, Res, } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionsService } from './subscriptions.service';
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
  constructor(private readonly subscriptionsService: SubscriptionsService, private readonly authService: AuthService,) {}

  @Get()
  async getSubscriptionsPage(@Req() req: Request, @Res() res: Response) {
    const auth = await this.authService.getAuthData(req);
    const plans = await this.subscriptionsService.findAllPlans();

    let currentSubscription: CurrentSubscription | null = null;

    if (auth.user) {
      currentSubscription = await this.subscriptionsService.getCurrentUserSubscription(auth.user.id);
    }

    return res.render('subscribe', {
      ...auth,
      title: 'Подписки Kino',
      plans,
      currentSubscription,
    });
  }

  @Get('add')
  async getAddPlanPage(@Req() req: Request, @Res() res: Response) {
    const auth = await this.authService.getAuthData(req);
    if (!auth) return;

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
    const auth = await this.authService.getAuthData(req);
    if (!auth) return;

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