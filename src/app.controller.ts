import { Controller, Get, Render, Query } from '@nestjs/common';

@Controller()
export class AppController {

  @Get()
  @Render('index')
  getIndexPage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';
    return {
      title: 'KINO',
      pageTitle: 'Главная страница',
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      cards: [
        { title: 'Форрест Гамп', description: 'Драма, 1994' },
        { title: 'Терминатор', description: 'Фантастика, 1984' },
      ],
    };
  }
}

