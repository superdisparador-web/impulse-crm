import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthThrottlerGuard } from '../auth/guards/auth-throttler.guard';
import { CampaignClickService } from './campaign-click.service';

@UseGuards(AuthThrottlerGuard)
@Controller('r')
export class PublicRedirectController{constructor(private readonly clicks:CampaignClickService){}@Get(':token')@Throttle({default:{limit:30,ttl:60_000}})async redirect(@Param('token')token:string,@Req()req:Request,@Res()res:Response){try{const result=await this.clicks.resolve(token,{ip:req.ip,userAgent:req.get('user-agent')});if(result.url)return res.redirect(302,result.url);return this.fallback(res)}catch{return this.fallback(res)}}private fallback(res:Response){return res.status(410).type('html').send('<!doctype html><html lang=\"pt-BR\"><meta charset=\"utf-8\"><title>Link indisponível</title><body><main><h1>Link indisponível</h1><p>Este atendimento não está disponível no momento. Entre em contato com a imobiliária.</p></main></body></html>')}}
