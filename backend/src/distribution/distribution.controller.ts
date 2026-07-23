import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuthenticatedUserRef } from '../auth/access-context.service';
import { DistributionService } from './distribution.service';
import { CreateDistributionListDto, UpdateDistributionListDto } from './dto/distribution-list.dto';
import { CreateDistributionMemberDto, ReorderDistributionListsDto, UpdateDistributionMemberDto } from './dto/distribution-member.dto';
import { ImportDistributionMembersDto } from './dto/import-distribution-members.dto';
import { ListDistributionsDto } from './dto/list-distributions.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class DistributionController {
  constructor(private readonly service: DistributionService) {}
  @Post('distribution-lists') @Permissions('distribution.list.create') createList(@Body() d:CreateDistributionListDto,@CurrentUser() u:AuthenticatedUserRef){return this.service.createList(d,u)}
  @Get('distribution-lists') @Permissions('distribution.list.read') lists(@CurrentUser() u:AuthenticatedUserRef){return this.service.lists(u)}
  @Get('distribution-lists/:id') @Permissions('distribution.list.read') getList(@Param('id') id:string,@CurrentUser() u:AuthenticatedUserRef){return this.service.getList(id,u)}
  @Patch('distribution-lists/:id') @Permissions('distribution.list.update') updateList(@Param('id') id:string,@Body() d:UpdateDistributionListDto,@CurrentUser() u:AuthenticatedUserRef){return this.service.updateList(id,d,u)}
  @Delete('distribution-lists/:id') @Permissions('distribution.list.delete') deleteList(@Param('id') id:string,@CurrentUser() u:AuthenticatedUserRef){return this.service.deleteList(id,u)}
  @Post('distribution-lists/:id/import') @Permissions('distribution.list.import') import(@Param('id') id:string,@Body() d:ImportDistributionMembersDto,@CurrentUser() u:AuthenticatedUserRef){return this.service.importMembers(id,d,u)}
  @Get('distribution-lists/:id/members') @Permissions('distribution.list.read') members(@Param('id') id:string,@CurrentUser() u:AuthenticatedUserRef){return this.service.members(id,u)}
  @Post('distribution-lists/:id/members') @Permissions('distribution.member.manage') addMember(@Param('id') id:string,@Body() d:CreateDistributionMemberDto,@CurrentUser() u:AuthenticatedUserRef){return this.service.addMember(id,d,u)}
  @Patch('distribution-lists/:id/members/:memberId') @Permissions('distribution.member.manage') updateMember(@Param('id') id:string,@Param('memberId') memberId:string,@Body() d:UpdateDistributionMemberDto,@CurrentUser() u:AuthenticatedUserRef){return this.service.updateMember(id,memberId,d,u)}
  @Delete('distribution-lists/:id/members/:memberId') @Permissions('distribution.member.manage') removeMember(@Param('id') id:string,@Param('memberId') memberId:string,@CurrentUser() u:AuthenticatedUserRef){return this.service.removeMember(id,memberId,u)}
  @Patch('distribution-lists/:id/reorder') @Permissions('distribution.member.manage') reorder(@Param('id') id:string,@Body() d:ReorderDistributionListsDto,@CurrentUser() u:AuthenticatedUserRef){return this.service.reorder(id,d,u)}
  @Get('distributions') @Permissions('distribution.assignment.read') distributions(@Query() q:ListDistributionsDto,@CurrentUser() u:AuthenticatedUserRef){return this.service.distributions(q,u)}
  @Get('distributions/:id') @Permissions('distribution.assignment.read') distribution(@Param('id') id:string,@CurrentUser() u:AuthenticatedUserRef){return this.service.distribution(id,u)}
  @Post('distributions/:id/retry') @Permissions('distribution.assignment.retry') retry(@Param('id') id:string,@CurrentUser() u:AuthenticatedUserRef){return this.service.retry(id,u)}
}
