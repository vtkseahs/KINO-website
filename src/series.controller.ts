import { Controller, Get, Query, Render } from '@nestjs/common';

@Controller('series')
export class SeriesController {
  @Get()
  @Render('series')
  getMoviesPage(@Query('auth') auth?: string) {
    const isAuth = auth === '1';

    return {
      title: 'Каталог сериалов Kino',
      isAuth,
      user: isAuth ? { name: 'Вика' } : null,
      cards: [
        {
          title: 'Бесстыжие',
          meta: '2011-2021, драма, США, 11 сезонов, 55 мин',
          image: '/img/movies_and_series/shame.png',
          alt: 'Бесстыжие',
        },
        {
          title: 'Сплетница',
          meta: '2007-2012, драма, США, 6 сезонов, 43 мин',
          image: '/img/movies_and_series/gg.png',
          alt: 'Сплетница',
        },
        {
          title: 'Отчаянные домохозяйки',
          meta: '2004-2012, комедия, США, 8 сезонов, 43 мин',
          image: '/img/movies_and_series/od.png',
          alt: 'Отчаянные домохозяйки',
        },
        {
          title: 'SKINS',
          meta: '2007-2013, драма, Великобритания, 7 сезонов, 45 мин',
          image: '/img/movies_and_series/skins.png',
          alt: 'skins',
        },
        {
          title: 'Атака титанов',
          meta: '2013-2023, аниме, Япония, 4 сезона, 24 мин',
          image: '/img/movies_and_series/aot.png',
          alt: 'атакатитанов',
        },
        {
          title: 'Великолепная пятерка',
          meta: '2019, детектив, Россия, 4 сезона, 39 мин',
          image: '/img/movies_and_series/fav_serial.png',
          alt: 'ВЕЛИКОЛЕПНАЯ ПЯТЕРКА',
        },
        {
          title: 'Возвращение Мухтара',
          meta: '2003–2019, детектив, Россия, 30 мин',
          image: '/img/movies_and_series/fav_serial2.png',
          alt: 'МУХТАР',
        },
        {
          title: 'Во все тяжкие',
          meta: '2008-2013, драма, США, 5 сезонов, 47 мин',
          image: '/img/movies_and_series/bb.png',
          alt: 'во все тяжкие',
        },
      ],
    }
  }
}