import { Module } from '@nestjs/common';

import { AccessContextService } from '../auth/access-context.service';
import { PrismaModule } from '../prisma/prisma.module';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [AccessContextService, UsersService],
  exports: [UsersService],
})
export class UsersModule {}