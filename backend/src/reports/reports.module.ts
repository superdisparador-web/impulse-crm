import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { IamModule } from '../iam/iam.module';
import { AccessContextService } from '../auth/access-context.service';

@Module({
  imports: [PrismaModule, IamModule],
  controllers: [ReportsController],
  providers: [ReportsService, AccessContextService]
})
export class ReportsModule {}
