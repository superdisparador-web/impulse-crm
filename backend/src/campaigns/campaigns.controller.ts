import { BadRequestException, Body, Controller, Delete, Get, Header, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ArchiveCampaignDto } from './dto/archive-campaign.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { EstimateCampaignDto } from './dto/estimate-campaign.dto';
import { ListCampaignsDto } from './dto/list-campaigns.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignsService } from './campaigns.service';
import { DestinationDto, ListMappingDto, ReviewDto, StepDto, TemplateConfigurationDto } from './dto/prepare-campaign.dto';
import { CampaignReasonDto, ScheduleCampaignDto } from './dto/operate-campaign.dto';
import { CampaignAudienceEstimateDto, CampaignSegmentationDto } from './dto/campaign-segmentation.dto';
import { ManualRecipientsDto } from './dto/manual-recipients.dto';
import { SendCampaignTestDto } from './dto/send-campaign-test.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

type AuthRequest = Request & { user?: { id?: string } };
type UploadedCampaignFile = { buffer: Buffer; originalname: string; mimetype: string; size: number };
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}
  private userId(req: AuthRequest) { return req.user?.id ?? ''; }
  @Get() findAll(@Req() req: AuthRequest, @Query() query: ListCampaignsDto) { return this.campaignsService.findAll(this.userId(req), query); }
  @Post('estimate') estimate(@Req() req: AuthRequest, @Body() data: EstimateCampaignDto) { return this.campaignsService.estimate(this.userId(req), data.filters); }
  @Post(':id/audience/estimate') estimateAudience(@Req() req:AuthRequest,@Param('id') id:string,@Body() data:CampaignAudienceEstimateDto){return this.campaignsService.estimateAudience(this.userId(req),id,data);}
  @Post(':id/audience/materialize') materializeAudience(@Req() req:AuthRequest,@Param('id') id:string,@Body() data:CampaignSegmentationDto){return this.campaignsService.materializeAudience(this.userId(req),id,data);}
  @Post(':id/audience/manual') manualAudience(@Req() req:AuthRequest,@Param('id') id:string,@Body() data:ManualRecipientsDto){return this.campaignsService.saveManualAudience(this.userId(req),id,data.recipients);}
  @Get(':id/audience/manual') getManualAudience(@Req() req:AuthRequest,@Param('id') id:string){return this.campaignsService.getManualAudience(this.userId(req),id);}
  @Post(':id/test-message') @UseGuards(PermissionsGuard) @Permissions('whatsapp:messages:send') testMessage(@Req() req:AuthRequest,@Param('id') id:string,@Body() data:SendCampaignTestDto){return this.campaignsService.sendTestMessage(this.userId(req),id,data);}
  @Get(':id/operation-estimate') operationEstimate(@Req() req:AuthRequest,@Param('id') id:string){return this.campaignsService.operationEstimate(this.userId(req),id);}
  @Get(':id') findOne(@Req() req: AuthRequest, @Param('id') id: string) { return this.campaignsService.findOne(this.userId(req), id); }
  @Post() create(@Req() req: AuthRequest, @Body() data: CreateCampaignDto) { return this.campaignsService.create(this.userId(req), data); }
  @Patch(':id') update(@Req() req: AuthRequest, @Param('id') id: string, @Body() data: UpdateCampaignDto) { return this.campaignsService.update(this.userId(req), id, data); }
  @Patch(':id/step') step(@Req() req:AuthRequest,@Param('id') id:string,@Body() data:StepDto){return this.campaignsService.saveStep(this.userId(req),id,data.currentStep);}
  @Post(':id/list/upload') @UseInterceptors(FileInterceptor('file',{limits:{fileSize:10*1024*1024,files:1}})) upload(@Req() req:AuthRequest,@Param('id') id:string,@UploadedFile() file:UploadedCampaignFile){return this.campaignsService.uploadList(this.userId(req),id,file);}
  @Patch(':id/list/mapping') mapList(@Req() req:AuthRequest,@Param('id') id:string,@Body() data:ListMappingDto){return this.campaignsService.mapAndAnalyze(this.userId(req),id,data);}
  @Get(':id/list/summary') summary(@Req() req:AuthRequest,@Param('id') id:string){return this.campaignsService.listSummary(this.userId(req),id);}
  @Get(':id/list/sample/:kind') sample(@Req() req:AuthRequest,@Param('id') id:string,@Param('kind') kind:string,@Query('page',new ParseIntPipe({optional:true})) page=1){if(!['valid','invalid','duplicates'].includes(kind))throw new BadRequestException('Amostra inválida');return this.campaignsService.recipientSample(this.userId(req),id,kind as 'valid'|'invalid'|'duplicates',page);}
  @Get(':id/list/:kind.csv') @Header('Content-Type','text/csv; charset=utf-8') async exportList(@Req() req:AuthRequest,@Param('id') id:string,@Param('kind') kind:string,@Res({passthrough:true}) res:Response){if(!['invalid','duplicates','clean'].includes(kind)) throw new BadRequestException('Exportação inválida');res.setHeader('Content-Disposition',`attachment; filename="campanha-${kind}.csv"`);return this.campaignsService.exportList(this.userId(req),id,kind as 'invalid'|'duplicates'|'clean');}
  @Patch(':id/template') template(@Req() req:AuthRequest,@Param('id') id:string,@Body() data:TemplateConfigurationDto){return this.campaignsService.configureTemplate(this.userId(req),id,data);}
  @Post(':id/template/media') @UseInterceptors(FileInterceptor('file',{limits:{fileSize:16*1024*1024,files:1}})) media(@Req() req:AuthRequest,@Param('id') id:string,@UploadedFile() file:UploadedCampaignFile){return this.campaignsService.uploadMedia(this.userId(req),id,file);}
  @Patch(':id/destination') destination(@Req() req:AuthRequest,@Param('id') id:string,@Body() data:DestinationDto){return this.campaignsService.configureDestination(this.userId(req),id,data);}
  @Post(':id/review') review(@Req() req:AuthRequest,@Param('id') id:string,@Body() data:ReviewDto){return this.campaignsService.review(this.userId(req),id,data);}
  @Post(':id/validate') validate(@Req() req:AuthRequest,@Param('id') id:string){return this.campaignsService.validateOperational(this.userId(req),id);}
  @Post(':id/start') start(@Req() req:AuthRequest,@Param('id') id:string){return this.campaignsService.start(this.userId(req),id);}
  @Post(':id/schedule') schedule(@Req() req:AuthRequest,@Param('id') id:string,@Body() data:ScheduleCampaignDto){return this.campaignsService.schedule(this.userId(req),id,data.scheduledAt);}
  @Post(':id/pause') pause(@Req() req:AuthRequest,@Param('id') id:string){return this.campaignsService.pause(this.userId(req),id);}
  @Post(':id/resume') resume(@Req() req:AuthRequest,@Param('id') id:string){return this.campaignsService.resume(this.userId(req),id);}
  @Get(':id/progress') progress(@Req() req:AuthRequest,@Param('id') id:string){return this.campaignsService.progress(this.userId(req),id);}
  @Get(':id/recipients') recipients(@Req() req:AuthRequest,@Param('id') id:string,@Query() query:{status?:string;search?:string;page?:number;limit?:number}){return this.campaignsService.recipientsPage(this.userId(req),id,query);}
  @Get(':id/events') events(@Req() req:AuthRequest,@Param('id') id:string){return this.campaignsService.events(this.userId(req),id);}
  @Get(':id/report') report(@Req() req:AuthRequest,@Param('id') id:string){return this.campaignsService.report(this.userId(req),id);}
  @Get(':id/results.csv') @Header('Content-Type','text/csv; charset=utf-8') async results(@Req() req:AuthRequest,@Param('id') id:string,@Res({passthrough:true}) res:Response){res.setHeader('Content-Disposition','attachment; filename="resultados-campanha.csv"');return this.campaignsService.exportResults(this.userId(req),id);}
  @Post(':id/recipients/:recipientId/retry') retry(@Req() req:AuthRequest,@Param('id') id:string,@Param('recipientId') recipientId:string){return this.campaignsService.retryRecipient(this.userId(req),id,recipientId);}
  @Patch(':id/archive') archive(@Req() req: AuthRequest, @Param('id') id: string, @Body() data: ArchiveCampaignDto) { return this.campaignsService.archive(this.userId(req), id, data.archived); }
  @Patch(':id/restore') restore(@Req() req: AuthRequest, @Param('id') id: string) { return this.campaignsService.restore(this.userId(req), id); }
  @Post(':id/cancel') cancel(@Req() req: AuthRequest, @Param('id') id: string, @Body() data:CampaignReasonDto) { return this.campaignsService.cancel(this.userId(req), id, data.reason); }
  @Delete(':id') remove(@Req() req: AuthRequest, @Param('id') id: string) { return this.campaignsService.remove(this.userId(req), id); }
}
