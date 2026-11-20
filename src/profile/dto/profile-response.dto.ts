import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ example: 'vika@gmail.com' })
  email: string;

  @ApiProperty({ example: 'Vika' })
  name: string;

  @ApiProperty({ example: 'USER' })
  role: string;

  @ApiProperty({ example: '2026-04-01T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: true })
  plusActive: boolean;
}
