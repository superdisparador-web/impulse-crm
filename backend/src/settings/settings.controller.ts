import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SettingsService } from './settings.service';

type AuthRequest = Request & { user?: { id?: string } };

@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}
  private userId(request: AuthRequest) { return request.user?.id ?? ''; }

  @Get('me') me(@Req() request: AuthRequest) { return this.service.me(this.userId(request)); }
  @Patch('me') updateMe(@Req() request: AuthRequest, @Body() body: Record<string, unknown>) { return this.service.updateMe(this.userId(request), body); }
  @Get('organization') organization(@Req() request: AuthRequest) { return this.service.organization(this.userId(request)); }
  @Patch('organization') updateOrganization(@Req() request: AuthRequest, @Body() body: Record<string, unknown>) { return this.service.updateOrganization(this.userId(request), body); }
  @Get('permissions') permissions(@Req() request: AuthRequest) { return this.service.permissions(this.userId(request)); }
  @Get('security') security(@Req() request: AuthRequest) { return this.service.security(this.userId(request)); }
  @Patch('security') updateSecurity(@Req() request: AuthRequest, @Body() body: Record<string, unknown>) { return this.service.updateSecurity(this.userId(request), body); }
  @Get('notifications') notifications(@Req() request: AuthRequest) { return this.service.me(this.userId(request)); }
  @Patch('notifications') updateNotifications(@Req() request: AuthRequest, @Body() body: Record<string, unknown>) { return this.service.updateNotifications(this.userId(request), body); }
  @Get('branding') branding(@Req() request: AuthRequest) { return this.service.organizationSettings(this.userId(request)); }
  @Patch('branding') updateBranding(@Req() request: AuthRequest, @Body() body: Record<string, unknown>) { return this.service.updateOrganizationSettings(this.userId(request), body, 'branding'); }
  @Get('operations') operations(@Req() request: AuthRequest) { return this.service.organizationSettings(this.userId(request)); }
  @Patch('operations') updateOperations(@Req() request: AuthRequest, @Body() body: Record<string, unknown>) { return this.service.updateOrganizationSettings(this.userId(request), body, 'operations'); }
  @Get('integrations') integrations(@Req() request: AuthRequest) { return this.service.integrations(this.userId(request)); }
  @Get('audit') audit(@Req() request: AuthRequest) { return this.service.audit(this.userId(request)); }
  @Get('system') system(@Req() request: AuthRequest) { return this.service.system(this.userId(request)); }
  @Patch('system') updateSystem(@Req() request: AuthRequest, @Body() body: Record<string, unknown>) { return this.service.updateSystem(this.userId(request), body); }
}
