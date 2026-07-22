import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OrganizationStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { ListOrganizationsDto } from './dto/list-organizations.dto';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

type AuthenticatedRequest = { user: { id: string; role?: string } };

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Permissions('organizations:create')
  @UseGuards(PermissionsGuard)
  create(@Body() data: CreateOrganizationDto, @Req() request: AuthenticatedRequest) {
    return this.organizationsService.create(data, request.user);
  }

  @Get()
  findAll(@Query() query: ListOrganizationsDto, @Req() request: AuthenticatedRequest) {
    return this.organizationsService.findAll(query, request.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.organizationsService.findOne(id, request.user);
  }

  @Patch(':id')
  @Permissions('organizations:update')
  @UseGuards(PermissionsGuard)
  update(@Param('id') id: string, @Body() data: UpdateOrganizationDto, @Req() request: AuthenticatedRequest) {
    return this.organizationsService.update(id, data, request.user);
  }

  @Patch(':id/status')
  @Permissions('organizations:update')
  @UseGuards(PermissionsGuard)
  updateStatus(@Param('id') id: string, @Body() data: Pick<UpdateOrganizationDto, 'active'>, @Req() request: AuthenticatedRequest) {
    return this.organizationsService.setStatus(id, data.active ? OrganizationStatus.ACTIVE : OrganizationStatus.INACTIVE, request.user);
  }

  @Patch(':id/activate')
  @Permissions('organizations:update')
  @UseGuards(PermissionsGuard)
  activate(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.organizationsService.setStatus(id, OrganizationStatus.ACTIVE, request.user);
  }

  @Patch(':id/inactivate')
  @Permissions('organizations:update')
  @UseGuards(PermissionsGuard)
  inactivate(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.organizationsService.setStatus(id, OrganizationStatus.INACTIVE, request.user);
  }

  @Patch(':id/suspend')
  @Permissions('organizations:suspend')
  @UseGuards(PermissionsGuard)
  suspend(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.organizationsService.setStatus(id, OrganizationStatus.SUSPENDED, request.user);
  }

  @Patch(':id/archive')
  @Permissions('organizations:archive')
  @UseGuards(PermissionsGuard)
  archive(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.organizationsService.remove(id, request.user);
  }

  @Delete(':id')
  @Permissions('organizations:archive')
  @UseGuards(PermissionsGuard)
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.organizationsService.remove(id, request.user);
  }
}
