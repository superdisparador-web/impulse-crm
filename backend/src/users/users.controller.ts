import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth/auth-user';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: ListUsersDto, @Req() req: AuthRequest) { return this.usersService.findAll(this.getOrganizationId(req), query); }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthRequest) { return this.usersService.findOne(this.getOrganizationId(req), id); }

  @Post()
  create(@Body() data: CreateUserDto, @Req() req: AuthRequest) { return this.usersService.create(data, this.getOrganizationId(req)); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateUserDto, @Req() req: AuthRequest) { return this.usersService.update(this.getOrganizationId(req), id, data); }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() data: UpdateUserStatusDto, @Req() req: AuthRequest) { return this.usersService.updateStatus(this.getOrganizationId(req), id, data.active); }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthRequest) { return this.usersService.remove(this.getOrganizationId(req), id); }

  private getOrganizationId(req: AuthRequest) {
    if (!req.user?.organizationId) throw new ForbiddenException('Usuário autenticado não possui organização vinculada');
    return req.user.organizationId;
  }
}
