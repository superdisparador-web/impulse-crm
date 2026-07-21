import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
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
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
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
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() data: UpdateOrganizationDto, @Req() request: AuthenticatedRequest) {
    return this.organizationsService.update(id, data, request.user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  updateStatus(@Param('id') id: string, @Body() data: Pick<UpdateOrganizationDto, 'active'>, @Req() request: AuthenticatedRequest) {
    return this.organizationsService.update(id, { active: data.active }, request.user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.organizationsService.remove(id, request.user);
  }
}
