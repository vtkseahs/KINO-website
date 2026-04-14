import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UnauthorizedException, UsePipes, ValidationPipe, } from '@nestjs/common';
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiCookieAuth, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse, ApiConflictResponse} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { ListMoviesQueryDto } from '../movies/dto/list-movies-query.dto';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionPlanApiDto } from './dto/create-subscription-plan-api.dto';
import { UpdateSubscriptionPlanApiDto } from './dto/update-subscription-plan-api.dto';
import {
  CurrentSubscriptionResponseDto,
  SubscriptionPlanResponseDto,
  SubscriptionPlansPageResponseDto,
} from './dto/subscription-plan-response.dto';

@ApiTags('subscriptions')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('api/subscriptions')
export class SubscriptionsApiController {
  constructor(private readonly subscriptionsService: SubscriptionsService,
              private readonly authService: AuthService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список тарифов' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiOkResponse({ type: SubscriptionPlansPageResponseDto })
  async findAll(
    @Query() query: ListMoviesQueryDto,
    @Res({ passthrough: true }) res: Response) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const result = await this.subscriptionsService.findAllPlansPaginated(page, limit);

    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить тариф по id' })
  @ApiOkResponse({ type: SubscriptionPlanResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный id' })
  @ApiNotFoundResponse({ description: 'Тариф не найден' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.findPlan(id);
  }

  @Post()
  @ApiCookieAuth('userId')
  @ApiOperation({ summary: 'Создать тариф' })
  @ApiCreatedResponse({ type: SubscriptionPlanResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректное тело запроса' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  async create(
    @Req() req: Request,
    @Body() dto: CreateSubscriptionPlanApiDto) {
    await this.authService.requireAdmin(req);
    return this.subscriptionsService.createPlan(dto);
  }

  @Patch(':id')
  @ApiCookieAuth('userId')
  @ApiOperation({ summary: 'Обновить тариф' })
  @ApiOkResponse({ type: SubscriptionPlanResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный id или тело запроса' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  @ApiNotFoundResponse({ description: 'Тариф не найден' })
  async update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionPlanApiDto) {
    await this.authService.requireAdmin(req);
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiCookieAuth('userId')
  @ApiOperation({ summary: 'Удалить тариф' })
  @ApiNoContentResponse({ description: 'Тариф удален' })
  @ApiBadRequestResponse({ description: 'Некорректный id' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  @ApiNotFoundResponse({ description: 'Тариф не найден' })
  async remove(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    await this.authService.requireAdmin(req);
    await this.subscriptionsService.removePlan(id);
  }

  @Post(':id/buy')
  @ApiCookieAuth('userId')
  @ApiOperation({ summary: 'Оформить подписку' })
  @ApiOkResponse({ type: SubscriptionPlanResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный id' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiNotFoundResponse({ description: 'Тариф не найден' })
  async buy(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const currentUser = await this.authService.requireUser(req);
    return this.subscriptionsService.buyPlan(id, currentUser.id);
  }

  @Get('current/me')
  @ApiCookieAuth('userId')
  @ApiOperation({ summary: 'Получить текущую подписку пользователя' })
  @ApiOkResponse({ type: CurrentSubscriptionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  async getCurrent(@Req() req: Request) {
    const currentUser = await this.authService.requireUser(req);
    return this.subscriptionsService.getCurrentUserSubscription(currentUser.id);
  }

  @Delete('current/me')
  @HttpCode(204)
  @ApiCookieAuth('userId')
  @ApiOperation({ summary: 'Отменить текущую подписку пользователя' })
  @ApiNoContentResponse({ description: 'Подписка отменена' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  async cancel(@Req() req: Request) {
    const currentUser = await this.authService.requireUser(req);
    await this.subscriptionsService.cancelSubscription(currentUser.id);
  }
}
