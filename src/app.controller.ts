import { Controller, Get, Render, Query } from '@nestjs/common';

@Controller()
export class AppController {

  @Get('mvc')
  @Render('index')
  getIndexPage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';
    return {
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
    };
  }
}

