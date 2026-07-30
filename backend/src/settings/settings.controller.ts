import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateBrandingSettingsDto, UpdateMeSettingsDto, UpdateNotificationSettingsDto, UpdateOperationalSettingsDto, UpdateOrganizationSettingsDto, UpdateSecuritySettingsDto, UpdateSystemSettingsDto } from './dto/settings.dto';
import { SettingsService } from './settings.service';
type AuthenticatedRequest = { user: { id: string; role?: string } };
class UpdatePermissionsDto { @IsArray() @IsString({ each: true }) permissionCodes!: string[]; }
@UseGuards(JwtAuthGuard) @Controller('settings')
export class SettingsController {
 constructor(private readonly settings: SettingsService) {}
 @Get('me') me(@Req() r: AuthenticatedRequest){return this.settings.me(r.user)} @Patch('me') updateMe(@Body() d:UpdateMeSettingsDto,@Req()r:AuthenticatedRequest){return this.settings.updateMe(d,r.user)}
 @Get('organization') organization(@Query('organizationId')i:string|undefined,@Req()r:AuthenticatedRequest){return this.settings.organization(i,r.user)} @Patch('organization') updateOrganization(@Query('organizationId')i:string|undefined,@Body()d:UpdateOrganizationSettingsDto,@Req()r:AuthenticatedRequest){return this.settings.updateOrganization(i,d,r.user)}
 @Get('permissions') permissions(@Req()r:AuthenticatedRequest){return this.settings.permissions(r.user)} @Patch('permissions/:role') updatePermissions(@Param('role')role:string,@Body()d:UpdatePermissionsDto,@Req()r:AuthenticatedRequest){return this.settings.updatePermissions(role,d.permissionCodes,r.user)}
 @Get('security') security(@Req()r:AuthenticatedRequest){return this.settings.scopedSettings('security',r.user)} @Patch('security') updateSecurity(@Body()d:UpdateSecuritySettingsDto,@Req()r:AuthenticatedRequest){return this.settings.updateScoped('security',d,r.user)}
 @Get('notifications') notifications(@Req()r:AuthenticatedRequest){return this.settings.notifications(r.user)} @Patch('notifications') updateNotifications(@Body()d:UpdateNotificationSettingsDto,@Req()r:AuthenticatedRequest){return this.settings.updateNotifications(d,r.user)}
 @Get('branding') branding(@Req()r:AuthenticatedRequest){return this.settings.scopedSettings('branding',r.user)} @Patch('branding') updateBranding(@Body()d:UpdateBrandingSettingsDto,@Req()r:AuthenticatedRequest){return this.settings.updateScoped('branding',d,r.user)}
 @Get('operations') operations(@Req()r:AuthenticatedRequest){return this.settings.scopedSettings('operations',r.user)} @Patch('operations') updateOperations(@Body()d:UpdateOperationalSettingsDto,@Req()r:AuthenticatedRequest){return this.settings.updateScoped('operations',d,r.user)}
 @Get('integrations') integrations(@Req()r:AuthenticatedRequest){return this.settings.integrations(r.user)} @Get('audit') audit(@Req()r:AuthenticatedRequest){return this.settings.audit(r.user)}
 @Get('system') system(@Req()r:AuthenticatedRequest){return this.settings.system(r.user)} @Patch('system') updateSystem(@Body()d:UpdateSystemSettingsDto,@Req()r:AuthenticatedRequest){return this.settings.updateSystem(d,r.user)}
}
