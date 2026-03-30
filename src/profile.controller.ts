import { Controller, Get, Query, Render } from '@nestjs/common';

@Controller('profile')
export class ProfileController {
  @Get()
  @Render('profile')
  getFavoritesPage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';

    return {
      title: 'Профиль Kino',
      isAuth,
      user: isAuth ? { name: 'Вика' } : null
    }
  }
}