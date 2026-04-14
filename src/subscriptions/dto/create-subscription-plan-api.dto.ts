import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionPlanApiDto {
  @ApiProperty({ example: 'название подписки' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'подписка без ограничений' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 399 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  price: number;

  @ApiProperty({ example: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationDays: number;
}
