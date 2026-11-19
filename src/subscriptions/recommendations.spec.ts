import { buildRecommendations } from './recommendations';

const film = (id: number, genre: string, reviews = 0, duration = 100) => ({
  id, title: String(id), duration, genre: { name: genre }, _count: { reviews },
});

describe('Персональный подбор КИНО Plus', () => {
  const opened = film(1, 'Драма');
  const favorite = film(2, 'Фантастика');
  const drama = film(3, 'драма');
  const science = film(4, 'Фантастика');
  const comedy = film(5, 'Комедия', 10);
  const catalog = [opened, favorite, drama, science, comedy];

  it('не усиливает жанр при повторных открытиях и связывает жанры с разным регистром', () => {
    const views = Array(10).fill({ movieId: opened.id, movie: opened });
    const result = buildRecommendations(catalog, [{ movieId: favorite.id, movie: favorite }], [], views, '');
    expect(result.recommendations.map(movie => movie.id)).toEqual([science.id, drama.id, opened.id, comedy.id]);
    expect(result.recommendations[1].reason).toContain('драма');
  });

  it('учитывает низкую оценку и не подменяет рекомендации подбором по настроению', () => {
    const result = buildRecommendations(catalog, [], [{ movieId: opened.id, movie: opened, rating: 2 }], [], 'light');
    expect(result.recommendations[0].id).toBe(comedy.id);
    expect(result.recommendations.at(-1)?.id).toBe(drama.id);
    expect(result.moodResults.map(movie => movie.id)).toEqual([comedy.id]);
    expect(result.collections).toEqual([]);
  });
  it('подбирает только фильмы, подходящие по настроению и времени', () => {
    const short = film(6, 'Комедия', 0, 90);
    const result = buildRecommendations([...catalog, short], [], [], [], 'light', '90');
    expect(result.moodResults.map(movie => movie.id)).toEqual([short.id]);
    expect(result.pickerUsed).toBe(true);
    expect(buildRecommendations(catalog, [], [], [], '', '90').moodResults).toEqual([]);
  });

});
