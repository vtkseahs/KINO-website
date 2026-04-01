import { Body, Controller, Get, Param, Post, Query, Render, Res, Sse} from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { Response } from 'express';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';


@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}
  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.moviesService.getEvents();
  }

  @Get()
  @Render('movies')
  async getMoviesPage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';
    const movies = await this.moviesService.findAll();

    const cards = movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      meta: `${movie.year}, ${movie.genre.name}, ${movie.duration} мин, ${movie.ageRating}`,
      image: movie.posterUrl || '/img/placeholder.png',
      alt: movie.title,
    }));

    return {
      title: 'Каталог фильмов Kino',
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      cards,
    };
  }

  @Get('add')
  @Render('movie-form')
  async getAddMoviePage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';
    const genres = await this.moviesService.findGenres();

    return {
      title: 'Добавить фильм',
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      movie: null,
      genres,
      formAction: '/movies/add',
      isEdit: false,
    };
  }

  @Post('add')
  async createMovie(
    @Body() createMovieDto: CreateMovieDto,
    @Res() res: Response,
  ) {
    const movie = await this.moviesService.create(createMovieDto);
    return res.redirect(`/movies/${movie.id}`);
  }

  @Get(':id')
  @Render('movie')
  async getMoviePage(@Param('id') id: string, @Query('auth') auth?: string) {
    const isAuth = auth === '1';
    const movie = await this.moviesService.findOne(Number(id));

    return {
      title: movie.title,
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      movie,
    };
  }

  @Get(':id/edit')
  @Render('movie-form')
  async getEditMoviePage(@Param('id') id: string, @Query('auth') auth?: string) {
    const isAuth = auth === '1';
    const movie = await this.moviesService.findOne(Number(id));
    const genres = await this.moviesService.findGenres();

    return {
      title: `Редактировать: ${movie.title}`,
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      movie,
      genres,
      formAction: `/movies/${movie.id}/edit`,
      isEdit: true,
    };
  }

  @Post(':id/edit')
  async updateMovie(
    @Param('id') id: string,
    @Body() updateMovieDto: UpdateMovieDto,
    @Res() res: Response,
  ) {
    await this.moviesService.update(Number(id), updateMovieDto);
    return res.redirect(`/movies/${id}`);
  }

  @Post(':id/delete')
  async deleteMovie(@Param('id') id: string, @Res() res: Response) {
    await this.moviesService.remove(Number(id));
    return res.redirect('/movies');
  }
}