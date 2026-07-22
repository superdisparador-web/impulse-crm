import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

type AuthenticatedRequest = { user: { id: string; role?: string } };

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  findMe(@Req() request: AuthenticatedRequest) {
    return this.usersService.findMe(request.user);
  }

  @Get()
  @Permissions('users:read')
  @UseGuards(PermissionsGuard)
  findAll(@Query() query: ListUsersDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.findAll(query, request.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.usersService.findOne(id, request.user);
  }

  @Post()
  @Permissions('users:create')
  @UseGuards(PermissionsGuard)
  create(@Body() data: CreateUserDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.create(data, request.user);
  }

  @Patch(':id')
  @Permissions('users:update')
  @UseGuards(PermissionsGuard)
  update(@Param('id') id: string, @Body() data: UpdateUserDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.update(id, data, request.user);
  }

  @Patch(':id/status')
  @Permissions('users:update')
  @UseGuards(PermissionsGuard)
  updateStatus(@Param('id') id: string, @Body() data: UpdateUserStatusDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.updateStatus(id, data.active, request.user);
  }

  @Patch(':id/reset-password')
  @Permissions('users:reset-password')
  @UseGuards(PermissionsGuard)
  resetPassword(@Param('id') id: string, @Body() data: ResetUserPasswordDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.resetPassword(id, data.password, request.user);
  }

  @Patch(':id/activate')
  @Permissions('users:activate')
  @UseGuards(PermissionsGuard)
  activate(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.usersService.updateStatus(id, true, request.user);
  }

  @Patch(':id/inactivate')
  @Permissions('users:deactivate')
  @UseGuards(PermissionsGuard)
  inactivate(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.usersService.updateStatus(id, false, request.user);
  }

  @Patch(':id/archive')
  @Permissions('users:archive')
  @UseGuards(PermissionsGuard)
  archive(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.usersService.remove(id, request.user);
  }

  @Delete(':id')
  @Permissions('users:archive')
  @UseGuards(PermissionsGuard)
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.usersService.remove(id, request.user);
  }
}
