import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Отзывы', () => {
  const prisma = { review: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() } };
  const service = new ReviewsService(prisma as unknown as PrismaService);
  beforeEach(() => jest.resetAllMocks());

  it.each([0, 11, 2.5, NaN])('отклоняет оценку %s за пределами целых чисел 1–10', async (rating) => {
    await expect(service.createForUser({ rating, comment: 'Отзыв', movieId: 1 }, 1)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.review.create).not.toHaveBeenCalled();
  });
  it('отклоняет пустой отзыв', async () => {
    await expect(service.createForUser({ rating: 7, comment: '  ', movieId: 1 }, 1)).rejects.toBeInstanceOf(BadRequestException);
  });
  it('сохраняет корректную оценку', async () => {
    prisma.review.create.mockResolvedValue({ id: 1 });
    await service.createForUser({ rating: 10, comment: 'Отлично', movieId: 3 }, 2);
    expect(prisma.review.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ rating: 10, userId: 2, movieId: 3 }) }));
  });
  it('запрещает изменять и удалять чужой отзыв', async () => {
    prisma.review.findUnique.mockResolvedValue({ id: 1, userId: 7 });
    await expect(service.update(1, { comment: 'Подмена' }, 2)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.remove(1, 2)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.review.update).not.toHaveBeenCalled();
    expect(prisma.review.delete).not.toHaveBeenCalled();
  });
});
