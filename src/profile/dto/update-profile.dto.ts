import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
export class UpdateProfileDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100) name?: string;
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
}
