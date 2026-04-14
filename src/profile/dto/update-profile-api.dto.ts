import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileApiDto {
  @ApiProperty({ example: 'Vika' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'vika@gmail.com' })
  @IsEmail()
  email: string;
}
