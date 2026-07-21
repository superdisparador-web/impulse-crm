import { MinLength } from 'class-validator';

export class ResetUserPasswordDto {
  @MinLength(6)
  password: string;
}
