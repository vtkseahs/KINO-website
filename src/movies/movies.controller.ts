import { Body, Controller, Get, Param, Post, Req, Render, Res, Sse, ParseIntPipe} from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { AuthService } from '../auth/auth.service';
import type { Request, Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService, private readonly authService: AuthService) {}
  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.moviesService.getEvents();
  }

  @Get()
  @Render('movies')
  async getMoviesPage(@Req() req: Request) {
    const auth = await this.authService.getAuthData(req);
    const movies = await this.moviesService.findAll();

    const cards = movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      meta: `${movie.year}, ${movie.genre.name}, ${movie.duration} мин, ${movie.ageRating}`,
      image: movie.posterUrl || '/img/placeholder.png',
      alt: movie.title,
    }));

    return {
      ...auth,
      title: 'Каталог фильмов Kino',
      cards,
    };
  }

  @Get('add')
  @Render('movie-form')
  async getAddMoviePage(@Req() req: Request, @Res() res: Response) {
    const auth = await this.authService.getAuthData(req);
    if (!auth) return;

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
  async createMovie(
    @Req() req: Request,
    @Body() createMovieDto: CreateMovieDto,
    @Res() res: Response,
  ) {
    await this.authService.requireAdmin(req);
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

    return {
      ...auth,
      title: movie.title,
      movie,
    };
  }

  @Get(':id/edit')
  async getEditMoviePage(
    @Param('id',ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const auth = await this.authService.getAuthData(req);
    if (!auth) return;

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
  async updateMovie(
    @Req() req: Request,
    @Param('id',ParseIntPipe) id: number,
    @Body() updateMovieDto: UpdateMovieDto,
    @Res() res: Response,
  ) {
    await this.authService.requireAdmin(req);
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