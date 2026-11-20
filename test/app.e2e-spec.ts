import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import SuperTokens from 'supertokens-node';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/main';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Приёмочные сценарии КИНО', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let origin: string;
  let storage: Server;
  const uploads: string[] = [];
  const prefix = `kino-e2e-${randomUUID()}`;
  const domain = '@example.test';
  const password = 'TestPassword_57';
  const email = prefix + domain;
  const secondEmail = prefix + '-admin' + domain;
  const editedEmail = prefix + '-edited' + domain;
  const title = `Тестовая комедия ${prefix}`;
  let movieId: number;
  let otherMovieId: number;
  let genreId: number;
  let member: ReturnType<typeof request.agent>;
  let admin: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    for (const env of ['DATABASE_URL', 'SUPERTOKENS_CONNECTION_URI']) {
      const url = process.env[env] && new URL(process.env[env]!);
      if (!url || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
        throw new Error(`Для e2e настройте локальный ${env} по .env.example`);
      }
    }
    origin = new URL(
      process.env.SUPERTOKENS_WEBSITE_DOMAIN ?? 'http://localhost:3000',
    ).origin;
    storage = createServer((req, res) => {
      if (req.method !== 'PUT') {
        res.writeHead(405).end();
        return;
      }
      uploads.push(req.url ?? '');
      req.resume();
      req.on('end', () => res.writeHead(200, { ETag: '"demo-etag"' }).end());
    });
    await new Promise<void>((resolve) =>
      storage.listen(0, '127.0.0.1', resolve),
    );
    const address = storage.address() as AddressInfo;
    Object.assign(process.env, {
      YANDEX_S3_ENDPOINT: `http://127.0.0.1:${address.port}`,
      YANDEX_S3_BUCKET: 'kino-e2e',
      YANDEX_S3_PUBLIC_BASE_URL: 'https://storage.example.test/kino-e2e',
      YANDEX_S3_ACCESS_KEY_ID: 'local-test',
      YANDEX_S3_SECRET_ACCESS_KEY: 'local-test',
    });
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    await configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    genreId = (
      await prisma.genre.findFirstOrThrow({ where: { name: 'Комедия' } })
    ).id;
    member = request.agent(app.getHttpServer());
    admin = request.agent(app.getHttpServer());
  }, 30000);

  afterAll(async () => {
    try {
      if (prisma) {
        const accounts = await prisma.user.findMany({
          where: { email: { startsWith: prefix } },
        });
        for (const account of accounts) {
          if (account.superTokensUserId)
            await SuperTokens.deleteUser(account.superTokensUserId);
        }
        await prisma.user.deleteMany({
          where: { email: { startsWith: prefix } },
        });
        await prisma.movie.deleteMany({
          where: { title: { contains: prefix } },
        });
      }
    } finally {
      await app?.close();
      if (storage)
        await new Promise<void>((resolve) => storage.close(() => resolve()));
    }
  }, 30000);

  it('отдаёт публичные страницы, health check, REST и GraphQL', async () => {
    const client = request(app.getHttpServer());
    await client.get('/').expect(200, /Рекомендуем к просмотру/);
    await client
      .get('/healthz')
      .expect(200)
      .expect(({ body }) => expect(body.status).toBe('ok'));
    await client
      .get('/api/docs-json')
      .expect(200)
      .expect(({ body }) => expect(body.openapi).toMatch(/^3\./));
    await client
      .post('/graphql')
      .send({ query: '{ movies { total } }' })
      .expect(200)
      .expect(({ body }) =>
        expect(body.data.movies.total).toBeGreaterThanOrEqual(0),
      );
    await client.get('/subscribe?pick=1').expect(200, /Войти для активации/);
    await client
      .post('/subscribe/activate')
      .type('form')
      .send({ result: 'success' })
      .expect(401);
  });

  it('регистрирует USER, защищает формы и позволяет ADMIN управлять каталогом', async () => {
    await member
      .post('/auth/register')
      .type('form')
      .send({ name: 'Зритель', email, password })
      .expect(302);
    await admin
      .post('/auth/register')
      .type('form')
      .send({ name: 'Редактор', email: secondEmail, password })
      .expect(302);
    await member.get('/profile').expect(200, /Зритель/);
    await member
      .post('/subscribe/activate')
      .type('form')
      .set('Origin', 'https://external.example')
      .send({ result: 'success' })
      .expect(403);
    await member
      .post('/subscribe/activate')
      .type('form')
      .send({ result: 'success' })
      .expect(403);
    await member
      .post('/subscribe/journal/1')
      .set('Origin', origin)
      .type('form')
      .send({ status: 'WATCHED' })
      .expect(403);
    await member.get('/movies/add').expect(403);
    await member
      .post('/api/movies')
      .set('Origin', origin)
      .send({ title })
      .expect(403);

    await prisma.user.update({
      where: { email: secondEmail },
      data: { role: 'ADMIN' },
    });
    await admin.get('/movies/add').expect(200, /Дата премьеры/);
    const created = await admin
      .post('/movies/add')
      .set('Origin', origin)
      .field('title', title)
      .field('description', 'Описание')
      .field('year', '2001')
      .field('duration', '85')
      .field('ageRating', '6+')
      .field('genreId', String(genreId))
      .field('actorNames', 'Тест Актёр')
      .field('directorNames', 'Тест Режиссёр')
      .field('providerUrls', 'https://example.test/film')
      .expect(302);
    movieId = Number(created.headers.location.split('/').at(-1));
    expect(movieId).toBeGreaterThan(0);
    await member
      .get(`/movies?q=${encodeURIComponent(title)}`)
      .expect(200, new RegExp(prefix));
    await member
      .get(`/movies/${movieId}`)
      .expect(200, /https:\/\/example\.test\/film/);
    await admin
      .post('/api/movies/upload-poster')
      .set('Origin', origin)
      .attach('poster', Buffer.from('Не изображение'), 'fake.png')
      .expect(400);
    const poster = 'public/img/movies_and_series/shrek.png';
    await member
      .post('/api/movies/upload-poster')
      .set('Origin', origin)
      .attach('poster', poster)
      .expect(403);
    const uploaded = await admin
      .post(`/movies/${movieId}/edit`)
      .set('Origin', origin)
      .field('description', 'Обновлённое описание')
      .attach('poster', poster)
      .expect(302);
    expect(uploaded.headers.location).toBe(`/movies/${movieId}`);
    expect(uploads).toHaveLength(1);
    expect(uploads[0]).toContain('/posters/');
    await member
      .get(`/movies/${movieId}`)
      .expect(200, /https:\/\/storage\.example\.test\/kino-e2e\/posters/);
  });

  it('сохраняет отзывы и избранное, ограничивает чужие операции', async () => {
    const review = { movieId, rating: 9, comment: 'Понравился сюжет' };
    await member
      .post('/api/reviews')
      .set('Origin', origin)
      .send({ ...review, rating: 11 })
      .expect(400);
    const created = await member
      .post('/api/reviews')
      .set('Origin', origin)
      .send(review)
      .expect(201);
    const id = created.body.id;
    await admin
      .patch(`/api/reviews/${id}`)
      .set('Origin', origin)
      .send({ rating: 1 })
      .expect(403);
    await admin.delete(`/api/reviews/${id}`).set('Origin', origin).expect(403);
    await member
      .patch(`/api/reviews/${id}`)
      .set('Origin', origin)
      .send({ rating: 8 })
      .expect(200);
    await member.get(`/movies/${movieId}`).expect(200, /Понравился сюжет/);
    await member
      .get('/api/reviews')
      .expect(200)
      .expect(({ body }) => expect(body.data[0].user.email).toBeUndefined());
    await admin.get('/reviews').expect(200);
    await member.get(`/reviews/${id}`).expect(200, /Понравился сюжет/);
    await member
      .get(`/reviews/movie/${movieId}`)
      .expect(200, /Понравился сюжет/);
    await member
      .post('/api/reviews')
      .set('Origin', origin)
      .send(review)
      .expect(409);
    const save = () =>
      member
        .post(`/favorites/movie/${movieId}/add`)
        .type('form')
        .set('Origin', origin)
        .send({});
    await save().expect(303);
    await save().expect(303);
    expect(
      await prisma.favorite.count({ where: { movieId, user: { email } } }),
    ).toBe(1);
    const { body: favorites } = await member.get('/api/favorites').expect(200);
    const favorite = favorites.data[0];
    await member.get('/favorites').expect(200, new RegExp(prefix));
    await member.get('/favorites/add').expect(200);
    await member.get(`/api/favorites/${favorite.id}`).expect(200);
    await admin.get(`/api/favorites/${favorite.id}`).expect(404);
    await admin
      .delete(`/api/favorites/${favorite.id}`)
      .set('Origin', origin)
      .expect(404);
    await member
      .patch(`/api/favorites/${favorite.id}`)
      .set('Origin', origin)
      .send({ movieId })
      .expect(200);
    await member
      .post('/api/favorites')
      .set('Origin', origin)
      .send({ movieId })
      .expect(409);
    await member
      .delete(`/api/favorites/${favorite.id}`)
      .set('Origin', origin)
      .expect(204);
    await member
      .post('/api/favorites')
      .set('Origin', origin)
      .send({ movieId })
      .expect(201);
  });

  it('проверяет активацию, подбор, дневник, киноитоги и уведомления', async () => {
    const activate = (result: string) =>
      member
        .post('/subscribe/activate')
        .set('Origin', origin)
        .type('form')
        .send({ result });
    await activate('failed')
      .expect('Location', '/subscribe?result=failed')
      .expect(303);
    await member
      .get('/subscribe?result=failed')
      .expect(200)
      .expect(({ text }) => {
        expect(text).toContain('Активация не удалась');
        expect(text).not.toContain('id="journal"');
      });
    await activate('success').expect(303);
    await activate('failed').expect(303);
    const journalPath = `/subscribe/journal/${movieId}`;
    const journal = (data: Record<string, string>) =>
      member.post(journalPath).set('Origin', origin).type('form').send(data);
    await journal({ status: 'WATCHED', watchedOn: '2026-02-31' }).expect(400);
    await journal({
      status: 'WATCHED',
      notes: 'Личное впечатление',
      company: 'С друзьями',
    }).expect(303);
    await member
      .get('/subscribe#report')
      .expect(200)
      .expect(({ text }) => {
        expect(text).toContain('Личное впечатление');
        expect(text).toContain('Тест Актёр');
        expect(text).toContain('data-minutes="85"');
        expect(text).toContain('data-count="1"');
      });
    await admin
      .get(`/movies/${movieId}`)
      .expect(200)
      .expect(({ text }) => expect(text).not.toContain('Личное впечатление'));
    await member
      .post('/subscribe/interests')
      .set('Origin', origin)
      .type('form')
      .send({ kind: 'ACTOR', label: 'Тест Актёр' })
      .expect(303);
    const created = await admin
      .post('/movies/add')
      .set('Origin', origin)
      .field('title', title + ' 2')
      .field('description', 'Описание')
      .field('year', '2010')
      .field('duration', '85')
      .field('ageRating', '6+')
      .field('genreId', String(genreId))
      .field('actorNames', 'Тест Актёр')
      .expect(302);
    otherMovieId = Number(created.headers.location.split('/').at(-1));

    await member
      .get('/subscribe?pick=1&mood=light&runtime=90&audience=family')
      .expect(200)
      .expect(({ text }) => {
        expect(text).toContain('Основной вариант');
        expect(text).toContain('85 мин, в пределах выбранного времени');
        expect(text).toContain('<strong>Новое</strong>');
      });
    const { headers } = await member
      .post('/subscribe/groups')
      .set('Origin', origin)
      .type('form')
      .send({ movies: [movieId, otherMovieId] })
      .expect(303);
    const groupPath = headers.location as string;
    const guest = request(app.getHttpServer());
    await guest
      .get(groupPath)
      .expect(200)
      .expect(({ text }) => {
        expect(text).toContain('Войдите, чтобы проголосовать');
        expect(text).not.toContain('Личное впечатление');
      });
    await guest.post(groupPath).type('form').send({ movieId }).expect(401);
    await member
      .post(groupPath)
      .set('Origin', origin)
      .type('form')
      .send({ movieId })
      .expect(303);
    await member
      .post(groupPath)
      .set('Origin', origin)
      .type('form')
      .send({ movieId: otherMovieId })
      .expect(303);
    await admin
      .post(groupPath)
      .set('Origin', origin)
      .type('form')
      .send({ movieId: otherMovieId })
      .expect(303);
    await member.get(groupPath).expect(200, /2 гол\./);
    await member
      .post('/subscribe/notifications/read')
      .set('Origin', origin)
      .expect(303);
    await member
      .get('/subscribe')
      .expect(200)
      .expect(({ text }) =>
        expect(text).not.toContain('<strong>Новое</strong>'),
      );
    await member.post('/subscribe/cancel').set('Origin', origin).expect(303);
    await journal({ status: 'WATCHED' }).expect(403);
    expect(
      await prisma.journalEntry.count({ where: { movieId, user: { email } } }),
    ).toBe(1);
  });

  it('обновляет способ входа, завершает сеанс и удаляет аккаунт', async () => {
    await member
      .patch('/api/profile')
      .set('Origin', origin)
      .send({ email: secondEmail })
      .expect(409);
    await member
      .patch('/api/profile')
      .set('Origin', origin)
      .send({ email: editedEmail })
      .expect(200);
    await member.post('/auth/logout').set('Origin', origin).expect(302);
    await member.get('/profile').expect(302).expect('Location', '/auth/login');
    const login = (login: string, suppliedPassword: string) =>
      member
        .post('/auth/login')
        .set('Origin', origin)
        .type('form')
        .send({ login, password: suppliedPassword });
    await login(email, password)
      .expect('Location', '/auth/login?error=1')
      .expect(302);
    await login(editedEmail, 'WrongPassword123')
      .expect('Location', '/auth/login?error=1')
      .expect(302);
    await login(editedEmail, password).expect('Location', '/').expect(302);
    await member.delete('/api/profile').set('Origin', origin).expect(204);
    await login(editedEmail, password)
      .expect('Location', '/auth/login?error=1')
      .expect(302);
    expect(
      await prisma.user.findUnique({ where: { email: editedEmail } }),
    ).toBeNull();
    expect(await prisma.journalEntry.count({ where: { movieId } })).toBe(0);
    await admin
      .delete(`/api/movies/${otherMovieId}`)
      .set('Origin', origin)
      .expect(204);
  });
});
