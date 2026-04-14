import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionPlanResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'название подписки' })
  title: string;

  @ApiProperty({ example: 'подписка без ограничений' })
  description: string;

  @ApiProperty({ example: 399 })
  price: number;

  @ApiProperty({ example: 30 })
  durationDays: number;
}

export class SubscriptionPlansPageResponseDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 3 })
  total: number;

  @ApiProperty({ type: [SubscriptionPlanResponseDto] })
  data: SubscriptionPlanResponseDto[];
}

export class CurrentSubscriptionResponseDto {
  @ApiProperty({ type: SubscriptionPlanResponseDto, nullable: true })
  plan: SubscriptionPlanResponseDto | null;

  @ApiProperty({ example: '2026-05-20T10:00:00.000Z', nullable: true })
  endsAt: string | null;
}
