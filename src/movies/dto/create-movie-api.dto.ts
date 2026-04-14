import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovieApiDto {
  @ApiProperty({ example: 'Тест' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Описание фильма' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  year: number;

  @ApiProperty({ example: 111 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({ example: '12+' })
  @IsString()
  @IsNotEmpty()
  ageRating: string;

  @ApiPropertyOptional({ example: 'https://ex.ru/poster.jpg', nullable: true })
  @IsOptional()
  @IsString()
  posterUrl?: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  genreId: number;
}
