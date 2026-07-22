import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type AuditPayload = {
  organizationId?: string | null;
  actorUserId?: string | null;
  module: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  after?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
};

const REDACTED_KEYS = new Set(['password', 'passwordHash', 'token', 'refreshToken', 'accessToken', 'cookie', 'cookies', 'authorization']);

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(payload: AuditPayload): Promise<void> {
    await this.prisma.auditLog.create({ data: { ...payload, before: this.sanitize(payload.before), after: this.sanitize(payload.after), metadata: this.sanitize(payload.metadata) } });
  }

  private sanitize(value: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (value === undefined || value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map((item) => this.sanitize(item as Prisma.InputJsonValue) ?? null) as Prisma.InputJsonArray;
    const output: Record<string, Prisma.InputJsonValue> = {};
    for (const [key, entry] of Object.entries(value)) {
      output[key] = REDACTED_KEYS.has(key) ? '[REDACTED]' : (this.sanitize(entry as Prisma.InputJsonValue) ?? null) as Prisma.InputJsonValue;
    }
    return output;
  }
}
