import { Controller, Get, Query, Render } from '@nestjs/common';

@Controller('review')
export class ReviewController {
  @Get()
  @Render('review')
  getFavoritesPage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';

    return {
      title: 'Отзывы Kino',
      isAuth,
      user: isAuth ? { name: 'Вика' } : null
    }
  }
}