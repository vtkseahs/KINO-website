import { ApiProperty } from '@nestjs/swagger';

class SubscriptionPlanDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'пример подписки' })
  title: string;

  @ApiProperty({ example: 'полный доступ к каталогу' })
  description: string;

  @ApiProperty({ example: 399 })
  price: number;

  @ApiProperty({ example: 30 })
  durationDays: number;
}

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

  @ApiProperty({ example: '2026-04-20T10:00:00.000Z', nullable: true })
  subscriptionEndsAt: string | null;

  @ApiProperty({ type: SubscriptionPlanDto, nullable: true })
  subscriptionPlan: SubscriptionPlanDto | null;
}
