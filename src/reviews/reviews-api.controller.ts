import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UnauthorizedException, UsePipes, ValidationPipe, } from '@nestjs/common';
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiCookieAuth, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse, ApiConflictResponse} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ListMoviesQueryDto } from '../movies/dto/list-movies-query.dto';
import { ReviewsService } from './reviews.service';
import { CreateReviewApiDto } from './dto/create-review-api.dto';
import { UpdateReviewApiDto } from './dto/update-review-api.dto';
import { ReviewResponseDto, ReviewsPageResponseDto } from './dto/review-response.dto';
import { UseGuards } from '@nestjs/common';
import { SuperTokensAuthGuard } from '../st-auth/guards/st-auth.guard';
import { UsersService } from '../users/users.service';
import type { StRequest } from '../st-auth/types/st-request';

@ApiTags('reviews')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('api/reviews')
export class ReviewsApiController {
  constructor(private readonly reviewsService: ReviewsService, private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список отзывов' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiOkResponse({ type: ReviewsPageResponseDto })
  async findAll(
    @Query() query: ListMoviesQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const result = await this.reviewsService.findAllPaginated(page, limit);
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить отзыв по id' })
  @ApiOkResponse({ type: ReviewResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный id' })
  @ApiNotFoundResponse({ description: 'Отзыв не найден' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.findOne(id);
  }

  @Post()
  @UseGuards(SuperTokensAuthGuard)
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Создать отзыв' })
  @ApiCreatedResponse({ type: ReviewResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректное тело запроса' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiConflictResponse({ description: 'Отзыв на этот фильм уже существует' })
  async create(@Req() req: StRequest, @Body() dto: CreateReviewApiDto) {
    const currentUser = await this.usersService.findBySuperTokensUserId(req.superTokensUserId);
    return this.reviewsService.createForUser(dto, currentUser.id);
  }

  @Patch(':id')
  @UseGuards(SuperTokensAuthGuard)
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Обновить отзыв' })
  @ApiOkResponse({ type: ReviewResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный id или тело запроса' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({ description: 'Нельзя изменять чужой отзыв' })
  @ApiNotFoundResponse({ description: 'Отзыв не найден' })
  @ApiConflictResponse({ description: 'Отзыв на этот фильм уже существует' })
  async update(
    @Req() req: StRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReviewApiDto) {
    const currentUser = await this.usersService.findBySuperTokensUserId(req.superTokensUserId);
    return this.reviewsService.update(id, dto, currentUser.id);
  }

  @Delete(':id')
  @UseGuards(SuperTokensAuthGuard)
  @HttpCode(204)
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Удалить отзыв' })
  @ApiNoContentResponse({ description: 'Отзыв удален' })
  @ApiBadRequestResponse({ description: 'Некорректный id' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({ description: 'Нельзя удалять чужой отзыв' })
  @ApiNotFoundResponse({ description: 'Отзыв не найден' })
  async remove(@Req() req: StRequest, @Param('id', ParseIntPipe) id: number) {
    const currentUser = await this.usersService.findBySuperTokensUserId(req.superTokensUserId);
    await this.reviewsService.remove(id, currentUser.id);
  }
}
