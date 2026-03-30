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

  @Get('movies')
  @Render('movies')
  getMoviesPage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';

    return {
      title: 'Каталог фильмов Kino',
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      cards: [
        {
          title: '1+1',
          meta: '2011, драма, Франция, 1ч 52мин',
          image: '/img/movies_and_series/1plus1.png',
          alt: '1+1',
        },
        {
          title: 'Интерстеллар',
          meta: '2014, фантастика, США, 2ч 49мин',
          image: '/img/movies_and_series/inerstellar.png',
          alt: 'Интерстеллар',
        },
        {
          title: 'Джентльмены',
          meta: '2019, криминал, США, 98 мин',
          image: '/img/movies_and_series/man.png',
          alt: 'Джентльмены',
        },
        {
          title: 'Побег из Шоушенка',
          meta: '1994, драма, США, 108 мин',
          image: '/img/movies_and_series/shush.png',
          alt: 'Побег из Шоушенка',
        },
        {
          title: 'Унесённые призраками',
          meta: '2001, аниме, Япония, 1ч 52мин',
          image: '/img/movies_and_series/anime.png',
          alt: 'Унесённые призраками',
        },
        {
          title: 'Леон',
          meta: '1994, боевик, Франция, 2ч 49мин',
          image: '/img/movies_and_series/leon.png',
          alt: 'Леон',
        },
        {
          title: 'Шрек',
          meta: '2001, мультфильм, США, 98 мин',
          image: '/img/movies_and_series/shrek.png',
          alt: 'Шрек',
        },
        {
          title: 'Поймай меня, если сможешь',
          meta: '2002, биография, США, 108 мин',
          image: '/img/movies_and_series/pmes.png',
          alt: 'Поймай меня, если сможешь',
        },
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