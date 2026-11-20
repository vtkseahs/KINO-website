import { moviePoster, placeholderPoster } from './movies/movie-poster';
import { Controller, Get, Req, Render } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth/auth.service';
import { MoviesService } from './movies/movies.service';
import { ApiExcludeController } from '@nestjs/swagger';

import { PrismaService } from './prisma/prisma.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly authService: AuthService,private readonly moviesService: MoviesService, private readonly prisma: PrismaService,) {}

  @Get('healthz')
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }

  @Get('about')
  @Render('about')
  async getAboutPage(@Req() req: Request) {
    return { ...(await this.authService.getAuthData(req)), title: 'О проекте КИНО' };
  }

  @Get()
  @Render('index')
  async getIndexPage(@Req() req: Request) {
    const auth = await this.authService.getAuthData(req);
    const { featured, recent, premieres } = await this.moviesService.findHomepageMovies(new Date());

    const makeCard = (movie: (typeof featured)[number]) => ({
      id: movie.id,
      title: movie.title,
      meta: `${movie.year}, ${movie.genre.name}, ${movie.duration} мин, ${movie.ageRating}`,
      image: moviePoster(movie.posterUrl, movie.title, movie.year),
      alt: movie.title,
    });
    const withPosters = featured.filter(movie => moviePoster(movie.posterUrl, movie.title, movie.year) !== placeholderPoster);
    const cards = (withPosters.length ? withPosters : featured).slice(0, 4).map(makeCard);

    return {
      ...auth,
      title: 'КИНО — онлайн-афиша и обсуждения фильмов',
      cards, recent: recent.map(makeCard), premieres: premieres.map(makeCard),
    };
  }
}