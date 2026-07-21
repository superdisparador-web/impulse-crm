import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

type AuthenticatedRequest = { user: { id: string; role?: Role | string } };

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  findMe(@Req() request: AuthenticatedRequest) {
    return this.usersService.findMe(request.user);
  }

  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  findAll(@Query() query: ListUsersDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.findAll(query, request.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.usersService.findOne(id, request.user);
  }

  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  create(@Body() data: CreateUserDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.create(data, request.user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() data: UpdateUserDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.update(id, data, request.user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  updateStatus(@Param('id') id: string, @Body() data: UpdateUserStatusDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.updateStatus(id, data.active, request.user);
  }

  @Patch(':id/reset-password')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  resetPassword(@Param('id') id: string, @Body() data: ResetUserPasswordDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.resetPassword(id, data.password, request.user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.usersService.remove(id, request.user);
  }
}
