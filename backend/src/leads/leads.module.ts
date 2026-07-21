import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { TimelineService } from './timeline.service';

@Module({ imports: [PrismaModule, AuthModule], controllers: [LeadsController], providers: [LeadsService, TimelineService] })
export class LeadsModule {}
