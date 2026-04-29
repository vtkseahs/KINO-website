import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UnauthorizedException, UsePipes, ValidationPipe, FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  UploadedFile,
  UseInterceptors,} from '@nestjs/common';
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiCookieAuth, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse, } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { CreateMovieApiDto } from './dto/create-movie-api.dto';
import { ListMoviesQueryDto } from './dto/list-movies-query.dto';
import { MovieResponseDto, MoviesPageResponseDto } from './dto/movie-response.dto';
import { MovieReviewsPageResponseDto } from './dto/movie-review-response.dto';
import { UpdateMovieApiDto } from './dto/update-movie-api.dto';
import { MoviesService } from './movies.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { StorageService } from '../storage/storage.service';
import { UseGuards } from '@nestjs/common';
import { Role } from '../../generated/prisma/client.js';
import { SuperTokensAuthGuard } from '../st-auth/guards/st-auth.guard';
import { Roles } from '../st-auth/decorators/roles.decorator';

@ApiTags('movies')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('api/movies')
export class MoviesApiController {
  constructor(private readonly moviesService: MoviesService, private readonly authService: AuthService,private readonly storageService: StorageService,) {}

  @Get()
  @ApiOperation({ summary: 'Получить список фильмов' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiOkResponse({ type: MoviesPageResponseDto })
  async findAll(
    @Query() query: ListMoviesQueryDto,
    @Res({ passthrough: true }) res: Response) {

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const result = await this.moviesService.findAllPaginated(page, limit);
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить фильм по id' })
  @ApiOkResponse({ type: MovieResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный id' })
  @ApiNotFoundResponse({ description: 'Фильм не найден' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.findOne(id);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Получить отзывы конкретного фильма' })
  @ApiOkResponse({ type: MovieReviewsPageResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный id' })
  @ApiNotFoundResponse({ description: 'Фильм не найден' })
  async findMovieReviews(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListMoviesQueryDto,
    @Res({ passthrough: true }) res: Response) {

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const result = await this.moviesService.findReviewsByMovie(id, page, limit);
    return result;
  }

  @Post()
  @UseGuards(SuperTokensAuthGuard)
  @Roles(Role.ADMIN)
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Создать фильм' })
  @ApiCreatedResponse({ type: MovieResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректное тело запроса' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  async create(@Body() dto: CreateMovieApiDto) {
    return this.moviesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(SuperTokensAuthGuard)
  @Roles(Role.ADMIN)
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Обновить фильм' })
  @ApiOkResponse({ type: MovieResponseDto })
  @ApiBadRequestResponse({ description: 'Некорректный id или тело запроса' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  @ApiNotFoundResponse({ description: 'Фильм не найден' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMovieApiDto) {
    return this.moviesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(SuperTokensAuthGuard)
  @Roles(Role.ADMIN)
  @HttpCode(204)
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Удалить фильм' })
  @ApiNoContentResponse({ description: 'Фильм удален' })
  @ApiBadRequestResponse({ description: 'Некорректный id' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  @ApiNotFoundResponse({ description: 'Фильм не найден' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.moviesService.remove(id);
  }
  @Post('upload-poster')
  @UseGuards(SuperTokensAuthGuard)
  @Roles(Role.ADMIN)
  @ApiCookieAuth('sAccessToken')
  @ApiOperation({ summary: 'Загрузить постер фильма' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: {
      type: 'object',
      properties: {
        poster: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['poster'],
    },
  })

  @UseInterceptors(FileInterceptor('poster'))
  async uploadPoster(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5_000_000 }),
        ],
      }),
    )
    poster: Express.Multer.File,
  ) {

    const url = await this.storageService.uploadPoster(poster);

    return { url };
  }
}
