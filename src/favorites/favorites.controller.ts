import { Body, Controller, Get, Param, Post, Query, Render, Res, } from '@nestjs/common';
import type { Response } from 'express';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @Render('favorites')
  async getFavoritesPage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';
    const favorites = await this.favoritesService.findAll();

    return {
      title: 'Избранное Kino',
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      favorites,
    };
  }

  @Get('add')
  @Render('favorite-form')
  async getAddFavoritePage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';
    const movies = await this.favoritesService.findMovies();

    return {
      title: 'Добавить в избранное',
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      favorite: null,
      movies,
      formAction: '/favorites/add',
      isEdit: false,
    };
  }

  @Post('add')
  async createFavorite(
    @Body() createFavoriteDto: CreateFavoriteDto,
    @Res() res: Response,
  ) {
    const favorite = await this.favoritesService.create(createFavoriteDto);
    return res.redirect(`/favorites/${favorite.id}`);
  }

  @Get(':id')
  @Render('favorite')
  async getFavoritePage(@Param('id') id: string, @Query('auth') auth?: string) {
    const isAuth = auth === '1';
    const favorite = await this.favoritesService.findOne(Number(id));

    return {
      title: `Избранное: ${favorite.movie.title}`,
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      favorite,
    };
  }

  @Get(':id/edit')
  @Render('favorite-form')
  async getEditFavoritePage(
    @Param('id') id: string,
    @Query('auth') auth?: string,
  ) {
    const isAuth = auth === '1';
    const favorite = await this.favoritesService.findOne(Number(id));
    const movies = await this.favoritesService.findMovies();

    return {
      title: `Редактировать избранное: ${favorite.movie.title}`,
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      favorite,
      movies,
      formAction: `/favorites/${favorite.id}/edit`,
      isEdit: true,
    };
  }

  @Post(':id/edit')
  async updateFavorite(
    @Param('id') id: string,
    @Body() updateFavoriteDto: UpdateFavoriteDto,
    @Res() res: Response,
  ) {
    await this.favoritesService.update(Number(id), updateFavoriteDto);
    return res.redirect(`/favorites/${id}`);
  }

  @Post(':id/delete')
  async deleteFavorite(@Param('id') id: string, @Res() res: Response) {
    await this.favoritesService.remove(Number(id));
    return res.redirect('/favorites');
  }
}