import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DiscussionsService } from './discussions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Обсуждения фильмов', () => {
  const prisma = {
    movie: { findUnique: jest.fn() },
    discussionPost: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    discussionLike: { deleteMany: jest.fn(), upsert: jest.fn() },
  };
  const service = new DiscussionsService(prisma as unknown as PrismaService);
  beforeEach(() => jest.resetAllMocks());

  it('не принимает пустые сообщения', async () => {
    await expect(service.create(1, 2, '  ')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.discussionPost.create).not.toHaveBeenCalled();
  });
  it('не позволяет отвечать на сообщения другого фильма', async () => {
    prisma.movie.findUnique.mockResolvedValue({ id: 1 });
    prisma.discussionPost.findUnique.mockResolvedValue({ movieId: 2 });
    await expect(service.create(1, 2, 'Ответ', '5')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.discussionPost.create).not.toHaveBeenCalled();
  });
  it('сохраняет ответ на сообщение этого фильма', async () => {
    prisma.movie.findUnique.mockResolvedValue({ id: 1 });
    prisma.discussionPost.findUnique.mockResolvedValue({ movieId: 1 });
    await service.create(1, 2, '  Ответ  ', '5');
    expect(prisma.discussionPost.create).toHaveBeenCalledWith({ data: { movieId: 1, userId: 2, parentId: 5, content: 'Ответ' } });
  });
  it('не позволяет поставить лайк сообщению другого фильма', async () => {
    prisma.discussionPost.findUnique.mockResolvedValue({ movieId: 2 });
    await expect(service.toggleLike(1, 5, 2)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.discussionLike.upsert).not.toHaveBeenCalled();
  });
  it('ставит и убирает лайк', async () => {
    prisma.discussionPost.findUnique.mockResolvedValue({ movieId: 1 });
    prisma.discussionLike.deleteMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
    await service.toggleLike(1, 5, 2);
    await service.toggleLike(1, 5, 2);
    expect(prisma.discussionLike.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.discussionLike.deleteMany).toHaveBeenCalledTimes(2);
  });
});
