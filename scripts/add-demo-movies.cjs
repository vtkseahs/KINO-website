// Добавляет фильмы для демонстрации, не изменяя существующие записи.
require('dotenv').config({ quiet: true });
const { Client } = require('pg');
const { readFileSync } = require('node:fs');

const movies = [
  ['Начало', 'Профессиональный похититель секретов проникает в сны и получает задание внедрить идею в сознание человека.', 2010, 148, '12+', 'Фантастика'],
  ['Прибытие', 'Лингвист пытается установить контакт с внеземными гостями и понять цель их прибытия.', 2016, 116, '16+', 'Фантастика'],
  ['Побег из Шоушенка', 'Банкир, несправедливо осуждённый за убийство, находит дружбу и надежду в тюрьме Шоушенк.', 1994, 142, '16+', 'Драма'],
  ['Общество мёртвых поэтов', 'Новый преподаватель литературы вдохновляет учеников закрытой школы искать собственный путь.', 1989, 128, '12+', 'Драма'],
  ['День сурка', 'Телеведущий снова и снова переживает один и тот же день в небольшом американском городе.', 1993, 101, '12+', 'Комедия'],
  ['Отель «Гранд Будапешт»', 'Консьерж знаменитого отеля и его юный помощник оказываются в центре необычного приключения.', 2014, 100, '16+', 'Комедия'],
  ['ВАЛЛ·И', 'Одинокий робот, убирающий опустевшую Землю, встречает исследовательницу ЕВУ и отправляется в путешествие.', 2008, 98, '6+', 'мультфильм'],
  ['Головоломка', 'Эмоции девочки Райли пытаются помочь ей справиться с переездом и переменами в жизни.', 2015, 95, '6+', 'мультфильм'],
  ['Матрица', 'Программист узнаёт, что привычная ему реальность скрывает гораздо больше, чем кажется.', 1999, 136, '16+', 'боевик'],
  ['Миссия невыполнима: Протокол Фантом', 'Агент Итан Хант и его команда пытаются предотвратить международный кризис.', 2011, 133, '12+', 'боевик'],
];

async function main() {
  const url = new URL(process.env.DATABASE_URL);
  const client = new Client({
    host: url.hostname, port: Number(url.port), user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password), database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: true, ca: readFileSync('ca.pem', 'utf8') },
  });
  await client.connect();
  try {
    await client.query('BEGIN');
    for (const [title, description, year, duration, ageRating, genre] of movies) {
      const result = await client.query(
        `INSERT INTO "Movie" ("title", "description", "year", "duration", "ageRating", "genreId", "updatedAt")
         SELECT $1, $2, $3, $4, $5, g.id, NOW() FROM "Genre" g
         WHERE g.name = $6 AND NOT EXISTS (SELECT 1 FROM "Movie" WHERE lower(title) = lower($1))
         RETURNING title`, [title, description, year, duration, ageRating, genre],
      );
      if (!result.rowCount) {
        const exists = await client.query('SELECT 1 FROM "Movie" WHERE lower(title) = lower($1)', [title]);
        if (!exists.rowCount) throw new Error(`Не найден жанр для фильма: ${title}`);
      }
      console.log(result.rowCount ? `Добавлен: ${title}` : `Уже существует: ${title}`);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
main().catch((error) => { console.error('Не удалось добавить фильмы:', error.message); process.exitCode = 1; });
