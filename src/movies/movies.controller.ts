import { Body, Controller, Get, Param, Post, Req, Render, Res, Sse, ParseIntPipe, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, Query, } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { AuthService } from '../auth/auth.service';
import type { Request, Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@ApiExcludeController()
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService, private readonly authService: AuthService,private readonly storageService: StorageService, private readonly prisma: PrismaService,) {}
  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.moviesService.getEvents();
  }

  @Get()
  @Render('movies')
  async getMoviesPage(@Req() req: Request, @Query('q') q = '', @Query('genre') genre = '') {
    const auth = await this.authService.getAuthData(req);
    const genreId = Number(genre);
    const movies = await this.moviesService.findAll(q.trim(), Number.isInteger(genreId) && genreId > 0 ? genreId : undefined);
    const genres = (await this.moviesService.findGenres()).map(item => ({ ...item, selected: item.id === genreId }));

    const cards = movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      meta: `${movie.year}, ${movie.genre.name}, ${movie.duration} мин, ${movie.ageRating}`,
      image: movie.posterUrl || '/img/placeholder.svg',
      alt: movie.title,
    }));

    return {
      ...auth,
      title: 'Каталог фильмов Kino',
      cards,
      query: q,
      genres,
    };
  }

  @Get('add')
  @Render('movie-form')
  async getAddMoviePage(@Req() req: Request, @Res() res: Response) {
    await this.authService.requireAdmin(req);
    const auth = await this.authService.getAuthData(req);

    const genres = await this.moviesService.findGenres();

    return res.render('movie-form', {
      ...auth,
      title: 'Добавить фильм',
      movie: null,
      genres,
      formAction: '/movies/add',
      isEdit: false,
    });
  }

  @Post('add')
  @UseInterceptors(FileInterceptor('poster'))
  async createMovie(
    @Req() req: Request,
    @Body() createMovieDto: CreateMovieDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [new MaxFileSizeValidator({ maxSize: 5_000_000 }),],
      }),
    )
    poster: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    await this.authService.requireAdmin(req);
    if (poster) {
      createMovieDto.posterUrl = await this.storageService.uploadPoster(poster);
    }

    const movie = await this.moviesService.create(createMovieDto);
    return res.redirect(`/movies/${movie.id}`);
  }

  @Get(':id')
  @Render('movie')
  async getMoviePage(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const auth = await this.authService.getAuthData(req);
    const movie = await this.moviesService.findOne(id);

    if (auth.user) await this.prisma.movieView.create({ data: { userId: auth.user.id, movieId: id } });
    const reviews = await this.prisma.review.findMany({ where: { movieId: id }, include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
    const favorite = auth.user ? await this.prisma.favorite.findUnique({ where: { userId_movieId: { userId: auth.user.id, movieId: id } } }) : null;
    return { ...auth, title: movie.title, movie, favorite, reviews: reviews.map(review => ({ ...review, canManage: review.userId === auth.user?.id })), ownReview: reviews.some(review => review.userId === auth.user?.id) };
  }

  @Get(':id/edit')
  async getEditMoviePage(
    @Param('id',ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.authService.requireAdmin(req);
    const auth = await this.authService.getAuthData(req);

    const movie = await this.moviesService.findOne(id);
    const genres = await this.moviesService.findGenres();

    return res.render('movie-form', {
      ...auth,
      title: `Редактировать: ${movie.title}`,
      movie,
      genres,
      formAction: `/movies/${movie.id}/edit`,
      isEdit: true,
    });
  }

  @Post(':id/edit')
  @UseInterceptors(FileInterceptor('poster'))
  async updateMovie(
    @Req() req: Request,
    @Param('id',ParseIntPipe) id: number,
    @Body() updateMovieDto: UpdateMovieDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [new MaxFileSizeValidator({ maxSize: 5_000_000 })],
      }),
    )
    poster: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    await this.authService.requireAdmin(req);
    if (poster) {
      updateMovieDto.posterUrl = await this.storageService.uploadPoster(poster);
    }

    await this.moviesService.update(id, updateMovieDto);
    return res.redirect(`/movies/${id}`);
  }

  @Post(':id/delete')
  async deleteMovie(
    @Req() req: Request,
    @Param('id',ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    await this.authService.requireAdmin(req);
    await this.moviesService.remove(id);
    return res.redirect('/movies');
  }
}