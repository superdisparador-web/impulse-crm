import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { IamModule } from '../iam/iam.module';
import { AuditModule } from '../audit/audit.module';
import { AccessContextService } from '../auth/access-context.service';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [IamModule, AuditModule],
  controllers: [OrganizationsController],
  providers: [AccessContextService, OrganizationsService],
})
export class OrganizationsModule {}
