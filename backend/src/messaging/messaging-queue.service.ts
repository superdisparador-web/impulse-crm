import { Injectable } from '@nestjs/common';

export interface MessagingThrottleConfig {
  perSecond?: number;
  perMinute?: number;
  perHour?: number;
  perWhatsappAccount?: Record<string, { perSecond?: number; perMinute?: number; perHour?: number }>;
}

@Injectable()
export class MessagingQueueService {
  private paused = false;
  private throttleConfig: MessagingThrottleConfig = {};

  configureThrottle(config: MessagingThrottleConfig) { this.throttleConfig = config; return this.throttleConfig; }
  getThrottleConfig() { return this.throttleConfig; }
  pause() { this.paused = true; }
  resume() { this.paused = false; }
  isPaused() { return this.paused; }
  canProcess(whatsappAccountId?: string | null) { void whatsappAccountId; return !this.paused; }
}
