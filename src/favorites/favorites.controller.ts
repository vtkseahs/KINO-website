import { Body, Controller, Get, Param, Post, Req, Res,ParseIntPipe } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';
import { AuthService } from '../auth/auth.service';
import type { Request, Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService, private readonly authService: AuthService) {}

  @Get()
  async getFavoritesPage(@Req() req: Request, @Res() res: Response) {
    const auth = await this.authService.getAuthData(req);
    if (!auth.user) return res.redirect('/auth/login');

    const favorites = await this.favoritesService.findAll(auth.user.id);

    return res.render('favorites', {
      ...auth,
      title: 'Избранное Kino',
      favorites,
    });
  }

  @Post('movie/:movieId/add')
  async addMovie(@Req() req: Request, @Param('movieId', ParseIntPipe) movieId: number, @Res() res: Response) {
    const user = await this.authService.requireUser(req);
    await this.favoritesService.addMovie(user.id, movieId);
    return res.redirect('/subscribe');
  }

  @Post('movie/:movieId')
  async toggleMovie(@Req() req: Request, @Param('movieId', ParseIntPipe) movieId: number, @Res() res: Response) {
    const user = await this.authService.requireUser(req);
    await this.favoritesService.toggleMovie(user.id, movieId);
    return res.redirect(`/movies/${movieId}`);
  }

  @Get('add')
  async getAddFavoritePage(@Req() req: Request, @Res() res: Response) {
    await this.authService.requireUser(req);
    const auth = await this.authService.getAuthData(req);

    const movies = await this.favoritesService.findMovies();

    return res.render('favorite-form', {
      ...auth,
      title: 'Добавить в избранное',
      favorite: null,
      movies,
      formAction: '/favorites/add',
      isEdit: false,
    });
  }

  @Post('add')
  async createFavorite(
    @Req() req: Request,
    @Body() createFavoriteDto: CreateFavoriteDto,
    @Res() res: Response,
  ) {
    const currentUser = await this.authService.requireUser(req);
    const favorite = await this.favoritesService.create(createFavoriteDto, currentUser.id,);

    return res.redirect(`/favorites/${favorite.id}`);
  }

  @Get(':id')
  async getFavoritePage(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const auth = await this.authService.getAuthData(req);
    if (!auth.user) return res.redirect('/auth/login');

    const favorite = await this.favoritesService.findOne(id, auth.user.id);

    return res.render('favorite', {
      ...auth,
      title: `Избранное: ${favorite.movie.title}`,
      favorite,
    });
  }

  @Get(':id/edit')
  async getEditFavoritePage(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const auth = await this.authService.getAuthData(req);
    if (!auth.user) return res.redirect('/auth/login');

    const favorite = await this.favoritesService.findOne(id, auth.user.id);
    const movies = await this.favoritesService.findMovies();

    return res.render('favorite-form', {
      ...auth,
      title: `Редактировать избранное: ${favorite.movie.title}`,
      favorite,
      movies,
      formAction: `/favorites/${favorite.id}/edit`,
      isEdit: true,
    });
  }


  @Post(':id/edit')
  async updateFavorite(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFavoriteDto: UpdateFavoriteDto,
    @Res() res: Response,
  ) {
    const currentUser = await this.authService.requireUser(req);
    await this.favoritesService.update(id, updateFavoriteDto, currentUser.id);
    return res.redirect(`/favorites/${id}`);
  }

  @Post(':id/delete')
  async deleteFavorite(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const currentUser = await this.authService.requireUser(req);
    await this.favoritesService.remove(id, currentUser.id);
    return res.redirect('/favorites');
  }
}