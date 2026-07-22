import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { IamService } from './iam.service';

type AuthenticatedRequest = { user: { id: string } };

@UseGuards(JwtAuthGuard)
@Controller()
export class IamController {
  constructor(private readonly iam: IamService) {}

  @Get('me/permissions')
  permissions(@Req() request: AuthenticatedRequest) {
    return this.iam.permissionsForUser(request.user.id);
  }

  @Get('roles')
  @Permissions('roles:read')
  @UseGuards(PermissionsGuard)
  roles() {
    return this.iam.listRoles();
  }

  @Get('permissions')
  @Permissions('roles:read')
  @UseGuards(PermissionsGuard)
  permissionsCatalog() {
    return this.iam.listPermissions();
  }
}
