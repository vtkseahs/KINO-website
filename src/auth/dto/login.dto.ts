import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
export class LoginDto {
  @IsEmail() login: string;
  @IsString() @IsNotEmpty() password: string;
}
