import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AnalyticsRollupJob {
  private readonly logger = new Logger(AnalyticsRollupJob.name);

  async run() {
    this.logger.debug('Analytics rollup job placeholder executed');
    return { success: true };
  }
}
