import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UnauthorizedException, UsePipes, ValidationPipe, } from '@nestjs/common';
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiCookieAuth, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse, ApiConflictResponse} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { CreateFavoritesApiDto } from './dto/create-favorites-api.dto';
import { UpdateFavoritesApiDto } from './dto/update-favorites-api.dto';
import { FavoritesResponseDto, FavoritesPageResponseDto } from './dto/favorites-response.dto';
import { FavoritesService } from './favorites.service';
import { ListMoviesQueryDto } from '../movies/dto/list-movies-query.dto';

@ApiTags('favorites')
@ApiCookieAuth('userId')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('api/favorites')
export class FavoritesApiController {
  constructor(private readonly favoritesService: FavoritesService, private readonly authService: AuthService,) {}

  @Get()
  @ApiOperation({ summary: 'Получить избранное текущего пользователя' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiOkResponse({ type: FavoritesPageResponseDto })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  async findAll(
    @Req() req: Request,
    @Query() query: ListMoviesQueryDto,
    @Res({ passthrough: true }) res: Response) {

    const currUser = await this.authService.requireUser(req);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const result = await this.favoritesService.findAllPaginated(currUser.id, page, limit);
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить запись избранного по id' })
  @ApiOkResponse({ type: FavoritesResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный id' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiNotFoundResponse({ description: 'Запись избранного не найдена' })
  async findOne(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,) {

    const currUser = await this.authService.requireUser(req);
    return this.favoritesService.findOne(id, currUser.id);
  }

  @Post()
  @ApiOperation({ summary: 'Добавить фильм в избранное' })
  @ApiCreatedResponse({ type: FavoritesResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный запрос' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiConflictResponse({ description: 'Фильм уже есть в избранном' })
  async create(
    @Req() req: Request,
    @Body() dto: CreateFavoritesApiDto,
  ) {
    const currUser = await this.authService.requireUser(req);
    return this.favoritesService.create(dto, currUser.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить запись избранного' })
  @ApiOkResponse({ type: FavoritesResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный id или запрос' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiConflictResponse({ description: 'Фильм уже есть в избранном' })
  @ApiNotFoundResponse({ description: 'Запись избранного не найдена' })
  async update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFavoritesApiDto) {

    const currUser = await this.authService.requireUser(req);
    return this.favoritesService.update(id, dto, currUser.id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Удалить запись из избранного' })
  @ApiNoContentResponse({ description: 'Запись удалена' })
  @ApiBadRequestResponse({ description: 'Некорректный id' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiNotFoundResponse({ description: 'Запись избранного не найдена' })
  async remove(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number) {

    const currUser = await this.authService.requireUser(req);
    await this.favoritesService.remove(id, currUser.id);
  }
}
