import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewApiDto {
  @ApiProperty({ example: 9 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  rating: number;

  @ApiProperty({ example: 'Очень понравился фильм' })
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  movieId: number;
}
