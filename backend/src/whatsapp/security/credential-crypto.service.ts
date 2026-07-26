import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
const PREFIX = 'enc:v1:';
@Injectable()
export class WhatsappCredentialCryptoService {
  private key(): Buffer { const secret = process.env.SECRETS_ENCRYPTION_KEY || process.env.WHATSAPP_CREDENTIAL_SECRET; if (!secret || secret.length < 32) throw new InternalServerErrorException('SECRETS_ENCRYPTION_KEY obrigatório para credenciais'); return createHash('sha256').update(secret).digest(); }
  encrypt(value: string): string { if (value.startsWith(PREFIX)) return value; const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', this.key(), iv); const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); const tag = cipher.getAuthTag(); return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`; }
  decrypt(value: string): string { if (!value.startsWith(PREFIX)) throw new InternalServerErrorException('Credencial criptografada inválida'); const parts = value.slice(PREFIX.length).split(':'); if (parts.length !== 3) throw new InternalServerErrorException('Credencial criptografada inválida'); try { const iv=Buffer.from(parts[0], 'base64'), tag=Buffer.from(parts[1], 'base64'), encrypted=Buffer.from(parts[2], 'base64'); if(iv.length!==12||tag.length!==16||encrypted.length===0) throw new Error(); const decipher = createDecipheriv('aes-256-gcm', this.key(), iv); decipher.setAuthTag(tag); return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'); } catch { throw new InternalServerErrorException('Credencial criptografada inválida'); } }
}
