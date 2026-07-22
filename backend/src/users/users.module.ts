import { Module } from '@nestjs/common';
import { AccessContextService } from '../auth/access-context.service';
import { PasswordService } from '../auth/security/password.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({ imports: [PrismaModule], controllers: [UsersController], providers: [AccessContextService, PasswordService, UsersService], exports: [UsersService] })
export class UsersModule {}
