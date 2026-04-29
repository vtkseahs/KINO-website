import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UnauthorizedException, UsePipes, ValidationPipe, } from '@nestjs/common';
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiCookieAuth, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse, ApiConflictResponse} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CreateFavoritesApiDto } from './dto/create-favorites-api.dto';
import { UpdateFavoritesApiDto } from './dto/update-favorites-api.dto';
import { FavoritesResponseDto, FavoritesPageResponseDto } from './dto/favorites-response.dto';
import { FavoritesService } from './favorites.service';
import { ListMoviesQueryDto } from '../movies/dto/list-movies-query.dto';
import { UseGuards } from '@nestjs/common';
import { SuperTokensAuthGuard } from '../st-auth/guards/st-auth.guard';
import { UsersService } from '../users/users.service';
import type { StRequest } from '../st-auth/types/st-request';

@ApiTags('favorites')
@ApiCookieAuth('sAccessToken')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('api/favorites')
export class FavoritesApiController {
  constructor(private readonly favoritesService: FavoritesService, private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(SuperTokensAuthGuard)
  @ApiOperation({ summary: 'Получить избранное текущего пользователя' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiOkResponse({ type: FavoritesPageResponseDto })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  async findAll(
    @Req() req: StRequest,
    @Query() query: ListMoviesQueryDto,
    @Res({ passthrough: true }) res: Response) {

    const currentUser = await this.usersService.findBySuperTokensUserId(req.superTokensUserId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const result = await this.favoritesService.findAllPaginated(currentUser.id, page, limit);
    return result;
  }

  @Get(':id')
  @UseGuards(SuperTokensAuthGuard)
  @ApiOperation({ summary: 'Получить запись избранного по id' })
  @ApiOkResponse({ type: FavoritesResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный id' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiNotFoundResponse({ description: 'Запись избранного не найдена' })
  async findOne(
    @Req() req: StRequest,
    @Param('id', ParseIntPipe) id: number,) {

    const currentUser = await this.usersService.findBySuperTokensUserId(req.superTokensUserId);
    return this.favoritesService.findOne(id, currentUser.id);
  }

  @Post()
  @UseGuards(SuperTokensAuthGuard)
  @ApiOperation({ summary: 'Добавить фильм в избранное' })
  @ApiCreatedResponse({ type: FavoritesResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный запрос' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiConflictResponse({ description: 'Фильм уже есть в избранном' })
  async create(
    @Req() req: StRequest,
    @Body() dto: CreateFavoritesApiDto,
  ) {
    const currentUser = await this.usersService.findBySuperTokensUserId(req.superTokensUserId);
    return this.favoritesService.create(dto, currentUser.id);
  }

  @Patch(':id')
  @UseGuards(SuperTokensAuthGuard)
  @ApiOperation({ summary: 'Обновить запись избранного' })
  @ApiOkResponse({ type: FavoritesResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный id или запрос' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiConflictResponse({ description: 'Фильм уже есть в избранном' })
  @ApiNotFoundResponse({ description: 'Запись избранного не найдена' })
  async update(
    @Req() req: StRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFavoritesApiDto) {

    const currentUser = await this.usersService.findBySuperTokensUserId(req.superTokensUserId);
    return this.favoritesService.update(id, dto, currentUser.id);
  }

  @Delete(':id')
  @UseGuards(SuperTokensAuthGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Удалить запись из избранного' })
  @ApiNoContentResponse({ description: 'Запись удалена' })
  @ApiBadRequestResponse({ description: 'Некорректный id' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiNotFoundResponse({ description: 'Запись избранного не найдена' })
  async remove(
    @Req() req: StRequest,
    @Param('id', ParseIntPipe) id: number) {

    const currentUser = await this.usersService.findBySuperTokensUserId(req.superTokensUserId);
    await this.favoritesService.remove(id, currentUser.id);
  }
}
