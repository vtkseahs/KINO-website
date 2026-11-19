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
  { value: "90", label: "До 1 ч 30 мин" },
  { value: "120", label: "До 2 часов" },
  { value: "150", label: "До 2 ч 30 мин" },
];

type Film = { id: number; title: string; genre: { name: string } };
type Interaction = { movieId: number; movie: Film };
const genreKey = (name: string) => name.trim().toLocaleLowerCase('ru-RU');

export function buildRecommendations<T extends Film & { duration: number; _count: { reviews: number } }>(
  movies: T[],
  favorites: Interaction[],
  reviews: (Interaction & { rating: number })[],
  views: Interaction[],
  mood: string,
  runtime = '',
  requested = false,
) {
  const scores = new Map<string, number>();
  const labels = new Map<string, string>();
  const viewed = new Set<number>();
  const saved = new Set(favorites.map(item => item.movieId));
  const rated = new Set(reviews.map(item => item.movieId));

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

  const score = (movie: Film) => scores.get(genreKey(movie.genre.name)) ?? 0;
  const ranked = movies.filter(movie => !saved.has(movie.id) && !rated.has(movie.id))
    .sort((a, b) => score(b) - score(a)
      || Number(viewed.has(a.id)) - Number(viewed.has(b.id))
      || b._count.reviews - a._count.reviews
      || a.title.localeCompare(b.title, 'ru')
      || a.id - b.id);

  const selectedMood = moodOptions.find(option => option.value === mood);
  const moodGenres: readonly string[] = selectedMood ? moods[selectedMood.value as keyof typeof moods] : [];
  const runtimeLimit = runtimeOptions.find(option => option.value === runtime);
  const pickerUsed = Boolean(requested || selectedMood || runtimeLimit);
  const moodResults = pickerUsed ? ranked.filter(movie =>
    (!selectedMood || moodGenres.some(genre => genreKey(movie.genre.name).includes(genre)))
    && (!runtimeLimit || (movie.duration > 0 && movie.duration <= Number(runtimeLimit.value))),
  ) : [];

  const collections = [...scores.entries()].filter(([, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => ({
      name: labels.get(key),
      movies: ranked.filter(movie => genreKey(movie.genre.name) === key).slice(0, 4),
    }))
    .filter(collection => collection.movies.length)
    .slice(0, 3);

  const withReason = (movie: T) => ({
      ...movie,
      reason: score(movie) > 0 ? `По вашему интересу к жанру «${movie.genre.name.trim()}»` : undefined,
  });

  return {
    recommendations: ranked.slice(0, 8).map(withReason),
    moodResults: moodResults.slice(0, 4).map(withReason),
    pickerUsed,
    runtime: runtimeLimit?.value ?? '',
    selectedMoodLabel: selectedMood?.label,
    mood: selectedMood?.value ?? '',
    collections,
    hasPositiveSignals: [...scores.values()].some(value => value > 0),
  };
}
