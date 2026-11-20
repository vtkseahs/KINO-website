import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildRecommendations,
  ConciergeOptions,
  moodOptions,
  runtimeOptions,
  genreKey,
} from './recommendations';
import {
  calendarDate,
  dateKey,
  day,
  InterestForm,
  interestKinds,
  JournalForm,
  journalStatuses,
} from './plus-forms';
import {
  buildReport,
  buildTaste,
  buildWatchlist,
  topLabels,
} from './journal-summary';
import { buildNotifications } from './interests';

const withGenre = { movie: { include: { genre: true } } } as const;

@Injectable()
export class KinoPlusService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(
    userId: number,
    filters: {
      days: number;
      month: string;
      yearly: boolean;
      mood: string;
      runtime: string;
      pick: boolean;
      options: ConciergeOptions;
    },
  ) {
    const now = new Date();
    const since = new Date(now.getTime() - filters.days * day);
    const [
      favorites,
      reviews,
      uniqueViews,
      periodViews,
      movies,
      journal,
      interests,
      genres,
    ] = await Promise.all([
      this.prisma.favorite.findMany({ where: { userId }, include: withGenre }),
      this.prisma.review.findMany({ where: { userId }, include: withGenre }),
      this.prisma.movieView.findMany({
        where: { userId },
        distinct: ['movieId'],
        include: withGenre,
      }),
      this.prisma.movieView.groupBy({
        by: ['movieId'],
        where: { userId, viewedAt: { gte: since } },
        _count: true,
      }),
      this.prisma.movie.findMany({
        include: { genre: true, _count: { select: { reviews: true } } },
      }),
      this.prisma.journalEntry.findMany({
        where: { userId },
        include: withGenre,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.movieInterest.findMany({
        where: { userId },
        orderBy: { id: 'desc' },
      }),
      this.prisma.genre.findMany({ orderBy: { name: 'asc' } }),
    ]);
    const audience = reviews.length
      ? await this.prisma.review.groupBy({
          by: ['movieId'],
          where: {
            userId: { not: userId },
            movieId: { in: reviews.map((review) => review.movieId) },
          },
          _avg: { rating: true },
        })
      : [];
    const movieMap = new Map(movies.map((movie) => [movie.id, movie]));
    const openedGenres = new Map<string, { label: string; count: number }>();
    for (const view of periodViews) {
      const label = movieMap.get(view.movieId)?.genre.name;
      if (!label) continue;
      const key = genreKey(label);
      openedGenres.set(key, {
        label,
        count: (openedGenres.get(key)?.count ?? 0) + view._count,
      });
    }
    const notifications = buildNotifications(movies, interests, now);
    return {
      ...buildRecommendations(
        movies,
        favorites,
        reviews,
        uniqueViews,
        filters.mood,
        filters.runtime,
        filters.pick,
        { ...filters.options, journal, now },
      ),
      moodOptions,
      runtimeOptions,
      genreOptions: genres.map((genre) => ({
        ...genre,
        selected: filters.options.excluded?.includes(genre.id),
      })),
      viewCount: periodViews.reduce((total, view) => total + view._count, 0),
      uniqueViewCount: periodViews.length,
      openedGenres: [...openedGenres.values()].sort(
        (a, b) => b.count - a.count,
      ),
      ratings: topLabels(
        reviews
          .filter((review) => review.createdAt >= since)
          .map((review) => `${review.rating}/10`),
        10,
      ),
      journal: journal.map((entry) => ({
        ...entry,
        statusLabel: journalStatuses.find(
          (option) => option.value === entry.status,
        )?.label,
        date: entry.watchedOn && dateKey(entry.watchedOn),
      })),
      watchlist: buildWatchlist(favorites, journal, now),
      taste: buildTaste(
        journal,
        reviews,
        new Map(audience.map((group) => [group.movieId, group._avg.rating!])),
      ),
      report: buildReport(journal, reviews, filters.month, filters.yearly),
      interests: interests.map((interest) => ({
        ...interest,
        kindLabel: interestKinds.find((kind) => kind.value === interest.kind)
          ?.label,
      })),
      interestKinds,
      notifications,
      unread: notifications.filter((item) => item.isNew).length,
    };
  }

  async saveJournal(userId: number, movieId: number, form: JournalForm) {
    if (
      !(await this.prisma.movie.findUnique({
        where: { id: movieId },
        select: { id: true },
      }))
    ) {
      throw new NotFoundException('Фильм не найден');
    }
    const previous = await this.prisma.journalEntry.findUnique({
      where: { userId_movieId: { userId, movieId } },
    });
    const entered = form.watchedOn && calendarDate(form.watchedOn);
    const today = calendarDate(dateKey(new Date()))!;
    if (form.watchedOn && (!entered || entered > today)) {
      throw new BadRequestException('Укажите корректную дату просмотра');
    }
    const watchedOn =
      form.status === 'WATCHED'
        ? entered || previous?.watchedOn || today
        : form.status === 'REWATCH'
          ? entered || previous?.watchedOn || null
          : null;
    const data = {
      status: form.status,
      watchedOn,
      notes: form.notes?.trim() ?? '',
      impression: form.impression?.trim() ?? '',
      company: form.company?.trim() ?? '',
    };
    await this.prisma.journalEntry.upsert({
      where: { userId_movieId: { userId, movieId } },
      create: { userId, movieId, ...data },
      update: data,
    });
  }

  async deleteJournal(userId: number, movieId: number) {
    await this.prisma.journalEntry.deleteMany({ where: { userId, movieId } });
  }

  async follow(userId: number, form: InterestForm) {
    const label = form.label?.trim().replace(/\s+/g, ' ') || '';
    if (!label && form.kind !== 'PREMIERE')
      throw new BadRequestException('Укажите, что хотите отслеживать');
    const value = label ? genreKey(label) : '*';
    if (label && value === '*')
      throw new BadRequestException('Укажите название или имя');
    const key = { userId, kind: form.kind, value };
    await this.prisma.movieInterest.upsert({
      where: { userId_kind_value: key },
      create: { ...key, label: label || 'Все премьеры' },
      update: {},
    });
  }

  async unfollow(userId: number, id: number) {
    await this.prisma.movieInterest.deleteMany({ where: { userId, id } });
  }

  async markSeen(userId: number) {
    await this.prisma.movieInterest.updateMany({
      where: { userId },
      data: { seenAt: new Date() },
    });
  }
}
