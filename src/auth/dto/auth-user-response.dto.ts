import { ApiProperty } from '@nestjs/swagger';

export class AuthUserResponseDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ example: 'test@gmail.com' })
  email: string;

  @ApiProperty({ example: 'test' })
  name: string;

  @ApiProperty({ example: 'USER' })
  role: string;
}