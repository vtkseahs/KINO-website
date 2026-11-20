import { Field, Int, ObjectType } from '@nestjs/graphql';
@ObjectType({ description: 'Профиль пользователя' })
export class ProfileModel {
  @Field(() => Int, { description: 'id пользователя' })
  id: number;

  @Field({ description: 'почта пользователя' })
  email: string;

  @Field({ description: 'имя пользователя' })
  name: string;

  @Field({ description: 'роль' })
  role: string;

  @Field(() => String, { description: 'Дата регистрации' })
  createdAt: Date;

  @Field({ description: 'Активен ли КИНО Plus' })
  plusActive: boolean;
}
