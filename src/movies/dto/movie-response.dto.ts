import { ApiProperty } from '@nestjs/swagger';

class GenreSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Фантастика' })
  name: string;
}

export class MovieResponseDto {
  @ApiProperty({ example: 10 })
  id: number;

  @ApiProperty({ example: 'Тест' })
  title: string;

  @ApiProperty({ example: 'Описание фильма' })
  description: string;

  @ApiProperty({ example: 2026 })
  year: number;

  @ApiProperty({ example: 111 })
  duration: number;

  @ApiProperty({ example: '12+' })
  ageRating: string;

  @ApiProperty({ example: 'https://ex.ru/poster.jpg', nullable: true })
  posterUrl: string | null;

  @ApiProperty({ type: GenreSummaryDto })
  genre: GenreSummaryDto;
}

export class MoviesPageResponseDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 27 })
  total: number;

  @ApiProperty({ type: [MovieResponseDto] })
  data: MovieResponseDto[];
}
