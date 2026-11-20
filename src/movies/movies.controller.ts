import { dateKey, journalStatuses } from '../kino-plus/plus-forms';
import { PlusAccessService } from '../kino-plus/plus-access.service';
import { safeWatchLink } from './movie-metadata';
import { moviePoster } from './movie-poster';
import { Body, Controller, Get, Param, Post, Req, Render, Res, Sse, ParseIntPipe, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Query, } from '@nestjs/common';
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
  constructor(private readonly moviesService: MoviesService, private readonly authService: AuthService,private readonly storageService: StorageService, private readonly prisma: PrismaService, private readonly plusAccess: PlusAccessService,) {}
  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.moviesService.getEvents();
  }

  @Get()
  @Render('movies')
  async getMoviesPage(@Req() req: Request, @Query('q') q = '', @Query('genre') genre = '',
    @Query('page') rawPage = '1', @Query('sort') sort = '') {
    const query = typeof q === 'string' ? q.trim().slice(0, 150) : '';
    const parsedGenre = typeof genre === 'string' ? Number(genre) : NaN;
    const genreId = Number.isSafeInteger(parsedGenre) && parsedGenre > 0 && parsedGenre <= 2147483647
      ? parsedGenre : undefined;
    const parsedPage = typeof rawPage === 'string' ? Number(rawPage) : NaN;
    const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 && parsedPage <= 100000 ? parsedPage : 1;
    const byTitle = sort === 'title';
    const [auth, { movies, hasNext }, genreRows] = await Promise.all([
      this.authService.getAuthData(req),
      this.moviesService.findCatalog({ query, genreId, byTitle, page }),
      this.moviesService.findGenres(),
    ]);
    const genres = genreRows.map(item => ({ ...item, selected: item.id === genreId }));
    const link = (targetPage: number, sortByTitle = byTitle) => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (genreId) params.set('genre', String(genreId));
      if (sortByTitle) params.set('sort', 'title');
      if (targetPage > 1) params.set('page', String(targetPage));
      return params.size ? `/movies?${params}` : '/movies';
    };

    const cards = movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      meta: `${movie.year}, ${movie.genre.name}, ${movie.duration} мин, ${movie.ageRating}`,
      image: moviePoster(movie.posterUrl, movie.title, movie.year),
      alt: movie.title,
    }));

    return {
      ...auth,
      title: 'Каталог фильмов Kino',
      cards,
      query,
      genres,
      page,
      byTitle,
      sortLink: link(1, !byTitle),
      previous: page > 1 ? link(page - 1) : null,
      next: hasNext ? link(page + 1) : null,
    };
  }

  @Get('add')
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
  @UseInterceptors(FileInterceptor('poster', { limits: { fileSize: 5_000_000, files: 1 } }))
  async createMovie(
    @Req() req: Request,
    @Body() createMovieDto: CreateMovieDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [new MaxFileSizeValidator({ maxSize: 5_000_000 }), new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),],
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
    const plusActive = auth.user ? await this.plusAccess.isActive(auth.user.id) : false;
    const entry = auth.user && plusActive ? await this.prisma.journalEntry.findUnique({
      where: { userId_movieId: { userId: auth.user.id, movieId: id } },
    }) : null;
    const watchLinks = movie.watchLinks.map(safeWatchLink).filter(url => url !== null)
      .map(url => ({ href: url.href, label: url.hostname }));
    return {
      ...auth, title: movie.title, movie, favorite, plusActive, watchLinks,
      actors: movie.actors.join(', '), directors: movie.directors.join(', '),
      releaseDate: movie.premiereOn && dateKey(movie.premiereOn),
      entry, watchedOn: entry?.watchedOn && dateKey(entry.watchedOn), today: dateKey(new Date()),
      journalStatuses, reviews: reviews.map(review => ({ ...review, canManage: review.userId === auth.user?.id })), ownReview: reviews.some(review => review.userId === auth.user?.id) };
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
      movie: {
        ...movie, actorNames: movie.actors.join(', '), directorNames: movie.directors.join(', '),
        releaseDate: movie.premiereOn && dateKey(movie.premiereOn), providerUrls: movie.watchLinks.join('\n'),
      },
      genres,
      formAction: `/movies/${movie.id}/edit`,
      isEdit: true,
    });
  }

  @Post(':id/edit')
  @UseInterceptors(FileInterceptor('poster', { limits: { fileSize: 5_000_000, files: 1 } }))
  async updateMovie(
    @Req() req: Request,
    @Param('id',ParseIntPipe) id: number,
    @Body() updateMovieDto: UpdateMovieDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [new MaxFileSizeValidator({ maxSize: 5_000_000 }), new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ })],
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