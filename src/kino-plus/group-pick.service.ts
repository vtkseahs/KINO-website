import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { day } from './plus-forms';

@Injectable()
export class GroupPickService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: number, movieIds: number[]) {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.movie.count({ where: { id: { in: movieIds } } });
      if (count !== movieIds.length)
        throw new BadRequestException('Один из фильмов больше недоступен');
      await tx.groupPick.deleteMany({
        where: { ownerId, expiresAt: { lte: now } },
      });
      return tx.groupPick.create({
        data: { ownerId, movieIds, expiresAt: new Date(now.getTime() + day) },
      });
    });
  }

  async get(id: string, userId?: number) {
    const group = await this.findOpen(id);
    const [movies, counts, ownVote] = await Promise.all([
      this.prisma.movie.findMany({
        where: { id: { in: group.movieIds } },
        include: { genre: true },
      }),
      this.prisma.groupVote.groupBy({
        by: ['movieId'],
        where: { groupId: id },
        _count: true,
      }),
      userId
        ? this.prisma.groupVote.findUnique({
            where: { groupId_userId: { groupId: id, userId } },
          })
        : null,
    ]);
    const votes = new Map(counts.map((item) => [item.movieId, item._count]));
    const cards = new Map(
      movies.map((movie) => [
        movie.id,
        {
          ...movie,
          votes: votes.get(movie.id) ?? 0,
          voted: ownVote?.movieId === movie.id,
        },
      ]),
    );
    return {
      movies: group.movieIds
        .map((movieId) => cards.get(movieId))
        .filter((movie) => movie !== undefined),
      total: counts.reduce((sum, item) => sum + item._count, 0),
    };
  }

  async vote(id: string, userId: number, movieId: number) {
    const group = await this.findOpen(id);
    if (!group.movieIds.includes(movieId))
      throw new BadRequestException('Выберите фильм из голосования');
    await this.prisma.groupVote.upsert({
      where: { groupId_userId: { groupId: id, userId } },
      create: { groupId: id, userId, movieId },
      update: { movieId },
    });
  }

  private async findOpen(id: string) {
    const group = await this.prisma.groupPick.findFirst({
      where: { id, expiresAt: { gt: new Date() } },
    });
    if (!group)
      throw new NotFoundException('Голосование не найдено или уже завершилось');
    return group;
  }
}
