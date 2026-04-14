import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Пользователь, оставивший отзыв' })
export class ReviewUserModel {
  @Field(() => Int, { description: 'id пользователя' })
  id: number;

  @Field({ description: 'почта пользователя' })
  email: string;

  @Field({ description: 'имя пользователя' })
  name: string;
}