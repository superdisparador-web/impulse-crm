import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppLifecycleService } from './app-lifecycle.service';
import { pipelineModuleEnabled } from './config/runtime-config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);
  const lifecycle = app.get(AppLifecycleService);
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.prependOnceListener(signal, () => lifecycle.beginShutdown());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
  try {
    await app.listen(process.env.PORT || 3000);
    logger.log('Impulse CRM backend started');
    logger.log(pipelineModuleEnabled() ? 'Pipeline module enabled' : 'Pipeline module disabled');
  } catch (error) {
    const code = typeof error === 'object' && error && 'errorCode' in error ? String(error.errorCode) : typeof error === 'object' && error && 'code' in error ? String(error.code) : undefined;
    if (code === 'P1001' || code === 'P2024' || code === 'P2028') logger.error(JSON.stringify({ event: 'PRISMA_STARTUP_ERROR', code }));
    else logger.error('Backend startup failed');
    lifecycle.beginShutdown();
    await app.close();
    process.exitCode = 1;
  }
}
bootstrap();
