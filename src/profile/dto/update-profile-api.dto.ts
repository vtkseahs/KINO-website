import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileApiDto {
  @ApiProperty({ example: 'Vika' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'vika@gmail.com' })
  @IsEmail()
  @IsOptional()
  email?: string;
}
