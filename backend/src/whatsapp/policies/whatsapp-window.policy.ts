import { Injectable } from '@nestjs/common';
export const WHATSAPP_CUSTOMER_SERVICE_WINDOW_HOURS = 24;
@Injectable()
export class WhatsappWindowPolicy {
  windowEndsAt(lastInboundAt: Date): Date { return new Date(lastInboundAt.getTime() + WHATSAPP_CUSTOMER_SERVICE_WINDOW_HOURS * 60 * 60 * 1000); }
  canSendFreeMessage(windowEndsAt?: Date | null, now = new Date()): boolean { return Boolean(windowEndsAt && windowEndsAt.getTime() > now.getTime()); }
}
