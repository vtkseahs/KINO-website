const moods = {
  light: ['комедия', 'мультфильм', 'семейный'],
  exciting: ['боевик', 'приключения', 'триллер', 'криминал'],
  thoughtful: ['драма', 'фантастика', 'документальный', 'биография'],
} as const;

export const moodOptions = [
  { value: 'light', label: 'Хочется лёгкого' },
  { value: 'exciting', label: 'Хочется приключений' },
  { value: 'thoughtful', label: 'Хочется задуматься' },
];

export const runtimeOptions = [
  { value: '60', label: 'До 1 часа' },
  { value: '90', label: 'До 1 ч 30 мин' },
  { value: '120', label: 'До 2 часов' },
  { value: '150', label: 'До 2 ч 30 мин' },
];

export const genreKey = (name: string) =>
  name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU');

const lightGenres = [...moods.light, 'приключения'];
const seriousGenres = [
  ...moods.thoughtful,
  'триллер',
  'криминал',
  'история',
  'военный',
];
const matches = (name: string, genres: readonly string[]) =>
  genres.some((genre) => genreKey(name).includes(genre));

export const fitsGroup = (movie: { genre: { name: string } }) =>
  matches(movie.genre.name, lightGenres);

type Film = {
  id: number;
  title: string;
  genre: { name: string };
  genreId?: number;
  ageRating?: string;
  unusual?: boolean;
  premiereOn?: Date | null;
};
type Interaction = { movieId: number; movie: Film };

export interface ConciergeOptions {
  tone?: string;
  audience?: string;
  discovery?: string;
  excluded?: number[];
  seenTitles?: string[];
  journal?: (Interaction & { status: string })[];
  now?: Date;
}

export function buildRecommendations<
  T extends Film & { duration: number; _count: { reviews: number } },
>(
  movies: T[],
  favorites: Interaction[],
  reviews: (Interaction & { rating: number })[],
  views: Interaction[],
  mood: string,
  runtime = '',
  requested = false,
  options: ConciergeOptions = {},
) {
  const scores = new Map<string, number>();
  const labels = new Map<string, string>();
  const viewed = new Set<number>();
  const saved = new Set(favorites.map((item) => item.movieId));
  const rated = new Set(reviews.map((item) => item.movieId));
  const skip = new Set<number>();
  const highlyRatedGenres = new Set(
    reviews
      .filter((item) => item.rating >= 8)
      .map((item) => genreKey(item.movie.genre.name)),
  );

  const addScore = (movie: Film, points: number) => {
    const key = genreKey(movie.genre.name);
    scores.set(key, (scores.get(key) ?? 0) + points);
    labels.set(key, movie.genre.name.trim());
  };

  for (const item of favorites) addScore(item.movie, 4);
  for (const item of reviews) addScore(item.movie, item.rating - 6);
  for (const item of views) {
    if (viewed.has(item.movieId)) continue;
    viewed.add(item.movieId);
    addScore(item.movie, 1);
  }
  for (const item of options.journal ?? []) {
    if (
      ['DISMISSED', 'WATCHED', 'WATCHING', 'DROPPED', 'REWATCH'].includes(
        item.status,
      )
    ) {
      skip.add(item.movieId);
    }
    if (item.status === 'WANT' || item.status === 'REWATCH')
      addScore(item.movie, 2);
    if (item.status === 'DROPPED' || item.status === 'DISMISSED')
      addScore(item.movie, -3);
  }

  const score = (movie: Film) => scores.get(genreKey(movie.genre.name)) ?? 0;
  const compare = (a: T, b: T) =>
    score(b) - score(a) ||
    Number(viewed.has(a.id)) - Number(viewed.has(b.id)) ||
    b._count.reviews - a._count.reviews ||
    a.title.localeCompare(b.title, 'ru') ||
    a.id - b.id;

  const now = options.now ?? new Date();
  const available = movies.filter(
    (movie) =>
      !skip.has(movie.id) &&
      !rated.has(movie.id) &&
      (!movie.premiereOn || movie.premiereOn <= now),
  );
  const ranked = available
    .filter((movie) => !saved.has(movie.id))
    .sort(compare);

  const selectedMood = moodOptions.find((option) => option.value === mood);
  const moodGenres: readonly string[] = selectedMood
    ? moods[selectedMood.value as keyof typeof moods]
    : [];
  const runtimeLimit = runtimeOptions.find(
    (option) => option.value === runtime,
  );
  const pickerUsed = Boolean(requested || selectedMood || runtimeLimit);
  const excluded = new Set(options.excluded ?? []);
  const seenTitles = new Set((options.seenTitles ?? []).map(genreKey));
  const toneGenres = options.tone === 'light' ? lightGenres : seriousGenres;
  const moodResults = pickerUsed
    ? available
        .filter(
          (movie) =>
            !excluded.has(movie.genreId ?? 0) &&
            !seenTitles.has(genreKey(movie.title)) &&
            (!selectedMood || matches(movie.genre.name, moodGenres)) &&
            (!options.tone || matches(movie.genre.name, toneGenres)) &&
            (!runtimeLimit ||
              (movie.duration > 0 &&
                movie.duration <= Number(runtimeLimit.value))) &&
            (options.audience !== 'family' ||
              /^(?:0|6|12)\+$/.test(movie.ageRating ?? '')) &&
            (options.discovery !== 'familiar' || !movie.unusual),
        )
        .sort(
          (a, b) =>
            (options.audience
              ? Number(fitsGroup(b)) - Number(fitsGroup(a))
              : 0) ||
            (options.discovery === 'adventurous'
              ? Number(b.unusual ?? false) - Number(a.unusual ?? false)
              : 0) ||
            compare(a, b),
        )
    : [];

  const collections = [...scores.entries()]
    .filter(([, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => ({
      name: labels.get(key),
      movies: ranked
        .filter((movie) => genreKey(movie.genre.name) === key)
        .slice(0, 4),
    }))
    .filter((collection) => collection.movies.length)
    .slice(0, 3);

  const tasteReason = (movie: T) => {
    if (highlyRatedGenres.has(genreKey(movie.genre.name)))
      return `Вы высоко оценивали фильмы жанра «${movie.genre.name.trim()}»`;
    if (score(movie) > 0)
      return `По вашему интересу к жанру «${movie.genre.name.trim()}»`;
    return undefined;
  };

  return {
    recommendations: ranked
      .slice(0, 8)
      .map((movie) => ({ ...movie, reason: tasteReason(movie) })),
    moodResults: moodResults.slice(0, 3).map((movie) => {
      const reasons = [
        runtimeLimit && `${movie.duration} мин, в пределах выбранного времени`,
        selectedMood &&
          `жанр «${movie.genre.name}» подходит под выбранное настроение`,
        options.tone &&
          `жанр подходит под запрос на ${options.tone === 'light' ? 'лёгкий' : 'серьёзный'} фильм`,
        options.audience === 'family' &&
          `возрастная категория ${movie.ageRating}`,
        options.audience === 'group' &&
          fitsGroup(movie) &&
          'жанр подходит для просмотра с компанией',
        options.discovery === 'adventurous' &&
          movie.unusual &&
          'отмечен в каталоге как необычное кино',
        tasteReason(movie),
      ].filter(Boolean);
      return {
        ...movie,
        saved: saved.has(movie.id),
        reason: reasons.join(' · ') || 'Подходит под заданные условия',
      };
    }),
    pickerUsed,
    runtime: runtimeLimit?.value ?? '',
    mood: selectedMood?.value ?? '',
    collections,
    hasPositiveSignals: [...scores.values()].some((value) => value > 0),
  };
}
