import type {
  Genre,
  JournalEntry,
  Movie,
} from '../../generated/prisma/client.js';
import { dateKey, day } from './plus-forms';
import { fitsGroup, genreKey } from './recommendations';

export type CatalogFilm = Movie & { genre: Genre };
export type JournalFilm = JournalEntry & { movie: CatalogFilm };
type RatedFilm = { movieId: number; rating: number };

export function topLabels(labels: string[], limit = 5) {
  const counts = new Map<string, { label: string; count: number }>();
  for (const label of labels) {
    const key = genreKey(label);
    const item = counts.get(key);
    counts.set(key, {
      label: item?.label ?? label,
      count: (item?.count ?? 0) + 1,
    });
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ru'))
    .slice(0, limit);
}

export function buildTaste(
  journal: JournalFilm[],
  reviews: RatedFilm[],
  audience: Map<number, number>,
) {
  const watched = journal
    .filter(
      (entry) =>
        entry.status === 'WATCHED' ||
        (entry.status === 'REWATCH' && entry.watchedOn),
    )
    .map((entry) => entry.movie);
  const ratingsWithAudience = reviews.filter((review) =>
    audience.has(review.movieId),
  );
  const delta = ratingsWithAudience.reduce(
    (sum, review) =>
      sum + Math.abs(review.rating - audience.get(review.movieId)!),
    0,
  );
  return {
    watchedCount: watched.length,
    favoriteGenres: topLabels(watched.map((movie) => movie.genre.name)),
    favoriteActors: topLabels(watched.flatMap((movie) => movie.actors)),
    favoriteDirectors: topLabels(watched.flatMap((movie) => movie.directors)),
    decades: topLabels(
      watched.map((movie) => `${Math.floor(movie.year / 10) * 10}-е`),
    ),
    dropped: topLabels(
      journal
        .filter((entry) => entry.status === 'DROPPED')
        .map((entry) => entry.movie.genre.name),
    ),
    average: reviews.length
      ? (
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : null,
    comparison: ratingsWithAudience.length
      ? {
          count: ratingsWithAudience.length,
          difference: (delta / ratingsWithAudience.length).toFixed(1),
        }
      : null,
  };
}

export function buildWatchlist(
  favorites: { movie: CatalogFilm; createdAt: Date }[],
  journal: JournalFilm[],
  now: Date,
) {
  const journalByMovie = new Map(
    journal.map((entry) => [entry.movieId, entry]),
  );
  const saved = new Map<number, { movie: CatalogFilm; createdAt: Date }>();
  for (const item of favorites) {
    const status = journalByMovie.get(item.movie.id)?.status;
    if (!status || status === 'WANT' || status === 'REWATCH')
      saved.set(item.movie.id, item);
  }
  for (const entry of journal) {
    if (
      (entry.status === 'WANT' || entry.status === 'REWATCH') &&
      !saved.has(entry.movieId)
    ) {
      saved.set(entry.movieId, entry);
    }
  }
  const items = [...saved.values()].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const available = items.filter(
    ({ movie }) => !movie.premiereOn || movie.premiereOn <= now,
  );
  const groups = [
    {
      title: 'На будний вечер · до 100 минут',
      items: available.filter(({ movie }) => movie.duration <= 100),
    },
    {
      title: 'На выходные · больше 100 минут',
      items: available.filter(({ movie }) => movie.duration > 100),
    },
    {
      title: 'Для компании',
      items: available.filter(({ movie }) => fitsGroup(movie)),
    },
    {
      title: 'В списке 30 дней и дольше',
      items: available.filter(
        (item) => item.createdAt.getTime() <= now.getTime() - 30 * day,
      ),
    },
    {
      title: 'Ожидаемые премьеры',
      items: items
        .filter(({ movie }) => movie.premiereOn && movie.premiereOn > now)
        .sort(
          (a, b) =>
            a.movie.premiereOn!.getTime() - b.movie.premiereOn!.getTime(),
        ),
    },
  ];
  return groups
    .filter((group) => group.items.length)
    .map((group) => ({
      title: group.title,
      movies: group.items.slice(0, 8).map(({ movie }) => ({
        ...movie,
        premiereLabel: movie.premiereOn && dateKey(movie.premiereOn),
      })),
    }));
}

export function buildReport(
  journal: JournalFilm[],
  reviews: RatedFilm[],
  month: string,
  yearly: boolean,
) {
  const start = new Date(
    (yearly ? month.slice(0, 4) + '-01' : month) + '-01T00:00:00Z',
  );
  const end = new Date(start);
  if (yearly) end.setUTCFullYear(start.getUTCFullYear() + 1);
  else end.setUTCMonth(start.getUTCMonth() + 1);

  const completed = journal.filter(
    (entry) => entry.watchedOn && ['WATCHED', 'REWATCH'].includes(entry.status),
  );
  const films = completed
    .filter((entry) => entry.watchedOn! >= start && entry.watchedOn! < end)
    .map((entry) => entry.movie);
  const formerGenres = new Set(
    completed
      .filter((entry) => entry.watchedOn! < start)
      .map((entry) => genreKey(entry.movie.genre.name)),
  );
  const popular = topLabels(
    films.map((movie) => movie.genre.name),
    films.length,
  );
  const ratings = new Map(
    reviews.map((review) => [review.movieId, review.rating]),
  );
  const rated = films
    .filter((movie) => ratings.has(movie.id))
    .sort((a, b) => ratings.get(b.id)! - ratings.get(a.id)! || a.id - b.id);
  const byDuration = [...films].sort(
    (a, b) => b.duration - a.duration || a.id - b.id,
  );
  const best = rated[0];
  const worst =
    rated.length > 1 && ratings.get(rated.at(-1)!.id) !== ratings.get(best.id)
      ? rated.at(-1)
      : null;

  return {
    label: new Intl.DateTimeFormat(
      'ru-RU',
      yearly
        ? { year: 'numeric', timeZone: 'UTC' }
        : { month: 'long', year: 'numeric', timeZone: 'UTC' },
    ).format(start),
    count: films.length,
    minutes: films.reduce((sum, movie) => sum + movie.duration, 0),
    favoriteGenre: popular[0]?.label,
    newGenre: popular.find((item) => !formerGenres.has(genreKey(item.label)))
      ?.label,
    best: best && { title: best.title, rating: ratings.get(best.id) },
    worst: worst && { title: worst.title, rating: ratings.get(worst.id) },
    longest: byDuration[0],
    shortest: byDuration.length > 1 ? byDuration.at(-1) : null,
    unusual: films.find((movie) => movie.unusual),
  };
}
