import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginApiDto {
  @ApiProperty({ example: 'test@gmail.com' })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
