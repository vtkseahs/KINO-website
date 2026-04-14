import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoritesApiDto {
  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsInt()
  movieId: number;
}
