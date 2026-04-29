import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UnauthorizedException, UsePipes, ValidationPipe, } from '@nestjs/common';
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiCookieAuth, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse, ApiConflictResponse} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ListMoviesQueryDto } from '../movies/dto/list-movies-query.dto';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionPlanApiDto } from './dto/create-subscription-plan-api.dto';
import { UpdateSubscriptionPlanApiDto } from './dto/update-subscription-plan-api.dto';
import {
  CurrentSubscriptionResponseDto,
  SubscriptionPlanResponseDto,
  SubscriptionPlansPageResponseDto,
} from './dto/subscription-plan-response.dto';
import { UseGuards } from '@nestjs/common';
import { Role } from '../../generated/prisma/client.js';
import { SuperTokensAuthGuard } from '../st-auth/guards/st-auth.guard';
import { Roles } from '../st-auth/decorators/roles.decorator';
import type { StRequest } from '../st-auth/types/st-request';
import { UsersService} from '../users/users.service';

@ApiTags('subscriptions')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('api/subscriptions')
export class SubscriptionsApiController {
  constructor(private readonly subscriptionsService: SubscriptionsService,private readonly usersService: UsersService,) {}

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
  @UseGuards(SuperTokensAuthGuard)
  @Roles(Role.ADMIN)
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Создать тариф' })
  @ApiCreatedResponse({ type: SubscriptionPlanResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректное тело запроса' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  async create(
    @Body() dto: CreateSubscriptionPlanApiDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  @Patch(':id')
  @UseGuards(SuperTokensAuthGuard)
  @Roles(Role.ADMIN)
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Обновить тариф' })
  @ApiOkResponse({ type: SubscriptionPlanResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный id или тело запроса' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  @ApiNotFoundResponse({ description: 'Тариф не найден' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionPlanApiDto) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @Delete(':id')
  @UseGuards(SuperTokensAuthGuard)
  @Roles(Role.ADMIN)
  @HttpCode(204)
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Удалить тариф' })
  @ApiNoContentResponse({ description: 'Тариф удален' })
  @ApiBadRequestResponse({ description: 'Некорректный id' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  @ApiNotFoundResponse({ description: 'Тариф не найден' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.subscriptionsService.removePlan(id);
  }

  @Post(':id/buy')
  @UseGuards(SuperTokensAuthGuard)
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Оформить подписку' })
  @ApiOkResponse({ type: SubscriptionPlanResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный id' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiNotFoundResponse({ description: 'Тариф не найден' })
  async buy(@Req() req: StRequest, @Param('id', ParseIntPipe) id: number) {
    const currentUser = await this.usersService.findBySuperTokensUserId(req.superTokensUserId);
    return this.subscriptionsService.buyPlan(id, currentUser.id);
  }

  @Get('current/me')
  @UseGuards(SuperTokensAuthGuard)
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Получить текущую подписку пользователя' })
  @ApiOkResponse({ type: CurrentSubscriptionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  async getCurrent(@Req() req: StRequest) {
    const currentUser = await this.usersService.findBySuperTokensUserId(req.superTokensUserId);
    return this.subscriptionsService.getCurrentUserSubscription(currentUser.id);
  }

  @Delete('current/me')
  @UseGuards(SuperTokensAuthGuard)
  @HttpCode(204)
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Отменить текущую подписку пользователя' })
  @ApiNoContentResponse({ description: 'Подписка отменена' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  async cancel(@Req() req: StRequest) {
    const currentUser = await this.usersService.findBySuperTokensUserId(req.superTokensUserId);
    await this.subscriptionsService.cancelSubscription(currentUser.id);
  }
}
