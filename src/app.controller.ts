import { Controller, Get, Query, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index')
  getIndexPage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';

    return {
      title: 'Онлайн кинотеатр Kino',
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      cards: [
        {
          title: 'Зелёная книга',
          meta: '2018, биография, США, 130 мин, 18+',
          image: '/img/greenbook.png',
          alt: 'Зелёная книга',
        },
        {
          title: 'Форрест Гамп',
          meta: '1994, драма, США, 142 мин, 18+',
          image: '/img/forrgump.png',
          alt: 'Форрест Гамп',
        },
        {
          title: 'Люди в чёрном',
          meta: '1997, фантастика, США, 98 мин, 12+',
          image: '/img/pib.png',
          alt: 'Люди в чёрном',
        },
        {
          title: 'Терминатор',
          meta: '1984, фантастика, США, 108 мин, 18+',
          image: '/img/terminator.png',
          alt: 'Терминатор',
        },
      ],
    };
  }
}