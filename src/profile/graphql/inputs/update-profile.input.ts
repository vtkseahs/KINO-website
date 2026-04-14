import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: 'Данные для обновления профиля' })
export class UpdateProfileInput {
  @Field({ nullable: true,description: 'Новое имя' })
  name: string;

  @Field({ nullable: true,description: 'Новая почта' })
  email: string;
}