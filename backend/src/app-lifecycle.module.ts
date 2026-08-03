import { Global, Module } from '@nestjs/common';
import { AppLifecycleService } from './app-lifecycle.service';

@Global()
@Module({ providers: [AppLifecycleService], exports: [AppLifecycleService] })
export class AppLifecycleModule {}
