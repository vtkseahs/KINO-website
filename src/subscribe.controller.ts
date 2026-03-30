import { Controller, Get, Query, Render } from '@nestjs/common';

@Controller('subscribe')
export class SubscribeController {
  @Get()
  @Render('subscribe')
  getFavoritesPage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';

    return {
      title: 'Подписки Kino',
      isAuth,
      user: isAuth ? { name: 'Вика' } : null
    }
  }
}