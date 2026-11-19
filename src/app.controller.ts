import { moviePoster, placeholderPoster } from './movies/movie-poster';
import { Controller, Get, Req, Render } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth/auth.service';
import { MoviesService } from './movies/movies.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly authService: AuthService,private readonly moviesService: MoviesService,) {}

  @Get('about')
  @Render('about')
  async getAboutPage(@Req() req: Request) {
    return { ...(await this.authService.getAuthData(req)), title: 'О проекте КИНО' };
  }

  @Get()
  @Render('index')
  async getIndexPage(@Req() req: Request) {
    const auth = await this.authService.getAuthData(req);
    const movies = await this.moviesService.findAll();

    const makeCard = (movie: (typeof movies)[number]) => ({
      id: movie.id,
      title: movie.title,
      meta: `${movie.year}, ${movie.genre.name}, ${movie.duration} мин, ${movie.ageRating}`,
      image: moviePoster(movie.posterUrl, movie.title, movie.year),
      alt: movie.title,
    });
    const featured = movies.filter(movie => moviePoster(movie.posterUrl, movie.title, movie.year) !== placeholderPoster);
    const cards = (featured.length ? featured : movies).slice(0, 4).map(makeCard);
    const recent = [...movies].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 4).map(makeCard);

    return {
      ...auth,
      title: 'КИНО — онлайн-афиша и обсуждения фильмов',
      cards, recent,
    };
  }
}