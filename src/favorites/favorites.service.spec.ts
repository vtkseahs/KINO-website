import { FavoritesService } from './favorites.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Избранное', () => {
  const prisma = { favorite: { findUnique: jest.fn(), upsert: jest.fn(), delete: jest.fn() } };
  const service = new FavoritesService(prisma as unknown as PrismaService);
  beforeEach(() => jest.resetAllMocks());

  it('добавляет фильм без создания дубликата', async () => {
    await service.addMovie(3, 5);
    expect(prisma.favorite.upsert).toHaveBeenCalledWith({ where: { userId_movieId: { userId: 3, movieId: 5 } }, create: { userId: 3, movieId: 5 }, update: {} });
  });
  it('удаляет существующую запись при повторном нажатии', async () => {
    prisma.favorite.findUnique.mockResolvedValue({ id: 9 });
    await service.toggleMovie(3, 5);
    expect(prisma.favorite.delete).toHaveBeenCalledWith({ where: { id: 9 } });
    expect(prisma.favorite.upsert).not.toHaveBeenCalled();
  });
});
