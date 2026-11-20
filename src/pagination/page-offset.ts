import { BadRequestException } from '@nestjs/common';

export function pageOffset(page: number, limit: number): number {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException(
      'Количество записей на странице должно быть от 1 до 100',
    );
  }

  const offset = (page - 1) * limit;
  if (!Number.isInteger(page) || page < 1 || offset > 2147483647) {
    throw new BadRequestException('Некорректный номер страницы');
  }

  return offset;
}
