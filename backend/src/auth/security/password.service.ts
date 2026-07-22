import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

@Injectable()
export class PasswordService {
  validatePolicy(password: string): void {
    if (!PASSWORD_POLICY.test(password)) {
      throw new BadRequestException('A senha deve ter no mínimo 8 caracteres, com letra maiúscula, minúscula e número');
    }
  }

  async hash(password: string): Promise<string> {
    this.validatePolicy(password);
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  async verify(storedHash: string, password: string): Promise<boolean> {
    if (!storedHash?.startsWith('$2')) return false;
    return bcrypt.compare(password, storedHash);
  }

  tokenHash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
