import { Controller, Get, Req, Render } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth/auth.service';
import { MoviesService } from './movies/movies.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly authService: AuthService,private readonly moviesService: MoviesService,) {}

  @Get()
  @Render('index')
  async getIndexPage(@Req() req: Request) {
    const auth = await this.authService.getAuthData(req);
    const movies = await this.moviesService.findAll();

    const cards = movies.slice(0, 4).map((movie) => ({
      id: movie.id,
      title: movie.title,
      meta: `${movie.year}, ${movie.genre.name}, ${movie.duration} мин, ${movie.ageRating}`,
      image: movie.posterUrl || '/img/placeholder.png',
      alt: movie.title,
    }));

    return {
      ...auth,
      title: 'Онлайн кинотеатр Kino',
      cards: cards,
    };
  }
}