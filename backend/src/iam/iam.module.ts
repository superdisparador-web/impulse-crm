import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IamController } from './iam.controller';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { IamService } from './iam.service';

@Module({ imports: [PrismaModule], controllers: [IamController], providers: [IamService, PermissionsGuard], exports: [IamService, PermissionsGuard] })
export class IamModule {}
