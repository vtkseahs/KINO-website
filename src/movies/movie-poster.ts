const bundledPosters = new Map([
  ['Начало:2010', 'inception'],
  ['Прибытие:2016', 'arrival'],
  ['Побег из Шоушенка:1994', 'shawshank'],
  ['Общество мёртвых поэтов:1989', 'dead-poets'],
  ['День сурка:1993', 'groundhog-day'],
  ['Отель «Гранд Будапешт»:2014', 'grand-budapest'],
  ['ВАЛЛ·И:2008', 'wall-e'],
  ['Головоломка:2015', 'inside-out'],
  ['Матрица:1999', 'matrix'],
  ['Миссия невыполнима: Протокол Фантом:2011', 'ghost-protocol'],
]);

export const placeholderPoster = '/img/placeholder.svg';

export function moviePoster(posterUrl: string | null | undefined, title: string, year: number): string {
  const uploaded = posterUrl?.trim();
  if (uploaded && uploaded !== placeholderPoster) return uploaded;
  const bundled = bundledPosters.get(`${title}:${year}`);
  return bundled ? `/img/posters/${bundled}.jpg` : placeholderPoster;
}
