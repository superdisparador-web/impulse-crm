import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
const PREFIX = 'enc:v1:';
@Injectable()
export class WhatsappCredentialCryptoService {
  private key(): Buffer { const secret = process.env.WHATSAPP_CREDENTIAL_SECRET; if (!secret || secret.length < 32) throw new InternalServerErrorException('WHATSAPP_CREDENTIAL_SECRET obrigatório para credenciais WhatsApp'); return createHash('sha256').update(secret).digest(); }
  encrypt(value: string): string { if (value.startsWith(PREFIX)) return value; const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', this.key(), iv); const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); const tag = cipher.getAuthTag(); return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`; }
  decrypt(value: string): string { if (!value.startsWith(PREFIX)) return value; const parts = value.slice(PREFIX.length).split(':'); const decipher = createDecipheriv('aes-256-gcm', this.key(), Buffer.from(parts[0], 'base64')); decipher.setAuthTag(Buffer.from(parts[1], 'base64')); return Buffer.concat([decipher.update(Buffer.from(parts[2], 'base64')), decipher.final()]).toString('utf8'); }
}
