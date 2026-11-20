import type { MovieInterest } from '../../generated/prisma/client.js';
import type { CatalogFilm } from './journal-summary';
import { dateKey, day } from './plus-forms';
import { genreKey } from './recommendations';

const allPremieres = '*';

const movieLabels = {
  ACTOR: (movie: CatalogFilm) => movie.actors,
  DIRECTOR: (movie: CatalogFilm) => movie.directors,
  FRANCHISE: (movie: CatalogFilm) => (movie.franchise ? [movie.franchise] : []),
  GENRE: (movie: CatalogFilm) => [movie.genre.name],
  PREMIERE: (movie: CatalogFilm) => [movie.title],
};

export function buildNotifications(
  movies: CatalogFilm[],
  interests: MovieInterest[],
  now: Date,
) {
  const eventMap = new Map<
    number,
    {
      id: number;
      title: string;
      time: number;
      isNew: boolean;
      labels: Set<string>;
      premiere?: string;
    }
  >();

  for (const interest of interests) {
    const added = interest.createdAt.getTime();
    const seen = interest.seenAt?.getTime() ?? added - 1;
    for (const movie of movies) {
      const premiere = movie.premiereOn?.getTime();
      const upcoming = premiere !== undefined && premiere + day > now.getTime();
      const matches =
        (interest.kind === 'PREMIERE' && interest.value === allPremieres) ||
        movieLabels[interest.kind](movie).some(
          (label) => genreKey(label) === interest.value,
        );
      if (!matches) continue;
      const time =
        interest.kind === 'PREMIERE'
          ? upcoming
            ? Math.max(added, premiere - 7 * day)
            : 0
          : movie.createdAt.getTime();
      if (time < added || time > now.getTime()) continue;
      const existing = eventMap.get(movie.id) ?? {
        id: movie.id,
        title: movie.title,
        time,
        isNew: false,
        labels: new Set<string>(),
      };
      existing.time = Math.max(time, existing.time);
      existing.isNew ||= time > seen;
      existing.labels.add(interest.label);
      if (upcoming && movie.premiereOn)
        existing.premiere = dateKey(movie.premiereOn);
      eventMap.set(movie.id, existing);
    }
  }
  return [...eventMap.values()]
    .sort(
      (a, b) =>
        Number(b.isNew) - Number(a.isNew) || b.time - a.time || b.id - a.id,
    )
    .slice(0, 30)
    .map((event) => ({ ...event, labels: [...event.labels].join(', ') }));
}
