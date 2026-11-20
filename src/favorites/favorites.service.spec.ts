import { FavoritesService } from './favorites.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Избранное', () => {
  const prisma = {
    favorite: {
      findUnique: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const service = new FavoritesService(prisma as unknown as PrismaService);
  beforeEach(() => jest.resetAllMocks());

  it('добавляет фильм без создания дубликата', async () => {
    await service.addMovie(3, 5);
    expect(prisma.favorite.createMany).toHaveBeenCalledWith({
      data: { userId: 3, movieId: 5 },
      skipDuplicates: true,
    });
  });
  it('удаляет существующую запись при повторном нажатии', async () => {
    prisma.favorite.findUnique.mockResolvedValue({ id: 9 });
    await service.toggleMovie(3, 5);
    expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({
      where: { userId: 3, movieId: 5 },
    });
    expect(prisma.favorite.createMany).not.toHaveBeenCalled();
  });
});
