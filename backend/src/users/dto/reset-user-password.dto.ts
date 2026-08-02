import { MinLength } from 'class-validator';

export class ResetUserPasswordDto {
  @MinLength(8)
  password: string;
}
