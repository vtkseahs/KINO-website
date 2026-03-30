import { Controller, Get, Query, Render } from '@nestjs/common';

@Controller('favorites')
export class FavoritesController {
  @Get()
  @Render('favorites')
  getFavoritesPage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';

    return {
      title: 'Избранное Kino',
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      cards: [
        {
          title: 'Оппенгеймер',
          meta: '2023, биография, драма, США, Великобритания',
          image: 'img/1.png',
          alt: 'Оппенгеймер',
        },
        {
          title: 'Остров проклятых',
          meta: '2009, триллер, США, Канада',
          image: 'img/2.png',
          alt: 'Остров проклятых',
        },
      ],
    }
  }
}