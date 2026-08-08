import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { Prisma } from '@prisma/client';
import { AccessContextService, AuthenticatedUserRef } from '../../auth/access-context.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CompleteEmbeddedSignupDto, StartEmbeddedSignupDto } from '../dto/embedded-signup.dto';
import { WhatsappCredentialCryptoService } from '../security/credential-crypto.service';
import { MetaWhatsappClient, MetaTemplate } from './meta-whatsapp.client';

type SignupState = { organizationId:string; userId:string; accountId?:string; nonce:string; exp:number };

@Injectable()
export class MetaEmbeddedSignupService {
  constructor(private readonly prisma:PrismaService, private readonly access:AccessContextService, private readonly crypto:WhatsappCredentialCryptoService, private readonly meta:MetaWhatsappClient) {}

  private config(){ const appId=process.env.META_APP_ID, configId=process.env.META_EMBEDDED_SIGNUP_CONFIG_ID, secret=process.env.META_APP_SECRET; if(!appId||!configId||!secret) throw new BadRequestException('Integração Meta não configurada'); return {appId,configId,secret,apiVersion:process.env.META_GRAPH_API_VERSION||'v20.0'}; }
  private sign(value:string,secret:string){ return createHmac('sha256',secret).update(value).digest('base64url'); }
  private encode(state:SignupState,secret:string){ const payload=Buffer.from(JSON.stringify(state)).toString('base64url'); return `${payload}.${this.sign(payload,secret)}`; }
  private decode(value:string,secret:string){ const [payload,signature]=value.split('.'); if(!payload||!signature){ throw new UnauthorizedException('META_OAUTH_STATE_INVALID'); } const expected=this.sign(payload,secret); if(expected.length!==signature.length||!timingSafeEqual(Buffer.from(expected),Buffer.from(signature))) throw new UnauthorizedException('META_OAUTH_STATE_INVALID'); const state=JSON.parse(Buffer.from(payload,'base64url').toString()) as SignupState; if(state.exp<Date.now()) throw new UnauthorizedException('META_OAUTH_STATE_EXPIRED'); return state; }
  private async context(user:AuthenticatedUserRef){ const ctx=await this.access.resolve(user); if(ctx.global||!ctx.organizationId) throw new ForbiddenException('Organização obrigatória'); return ctx; }

  async signupConfiguration(user:AuthenticatedUserRef,accountId?:string){ const ctx=await this.context(user); if(accountId){ const found=await this.prisma.whatsappAccount.findFirst({where:{id:accountId,organizationId:ctx.organizationId!,deletedAt:null}}); if(!found) throw new BadRequestException('Conta WhatsApp não encontrada'); } const cfg=this.config(); return {appId:cfg.appId,configId:cfg.configId,apiVersion:cfg.apiVersion,state:this.encode({organizationId:ctx.organizationId!,userId:ctx.id,accountId,nonce:randomBytes(18).toString('hex'),exp:Date.now()+10*60_000},cfg.secret)}; }

  async createSession(dto:StartEmbeddedSignupDto,user:AuthenticatedUserRef){
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      throw new BadRequestException('FRONTEND_URL_NOT_CONFIGURED');
    }

    const returnUrl = new URL('/whatsapp', frontendUrl);

    const configuration=await this.signupConfiguration(user,dto.accountId), expiresAt=new Date(Date.now()+10*60_000).toISOString();
    const params=new URLSearchParams({client_id:configuration.appId,config_id:configuration.configId,redirect_uri:returnUrl.toString(),response_type:'code',override_default_response_type:'true',state:configuration.state});
    return {authorizationUrl:`https://www.facebook.com/${configuration.apiVersion}/dialog/oauth?${params}`,expiresAt};
  }

  async complete(dto:CompleteEmbeddedSignupDto,user:AuthenticatedUserRef){ const ctx=await this.context(user), cfg=this.config(), state=this.decode(dto.state,cfg.secret); if(state.organizationId!==ctx.organizationId||state.userId!==ctx.id||state.accountId!==dto.accountId) throw new UnauthorizedException('META_OAUTH_STATE_MISMATCH'); const exchanged=await this.meta.exchangeCode(dto.code); let token=exchanged.accessToken, expiresAt=exchanged.expiresAt; try { const renewed=await this.meta.renewToken(token); token=renewed.accessToken; expiresAt=renewed.expiresAt; } catch { /* Meta does not permit every token type to be exchanged. */ }
    const inspected=await this.meta.inspectToken(token); if(!inspected.valid) throw new UnauthorizedException('META_ACCESS_TOKEN_INVALID'); const assets=await this.meta.discoverEmbeddedAssets(token); if(!assets.length) throw new BadRequestException('Nenhum número do WhatsApp Business foi autorizado'); const credentialType=inspected.type==='SYSTEM_USER'?'SYSTEM_USER':'OAUTH_USER'; const selected=state.accountId?assets.filter(asset=>true):assets; const accounts:Awaited<ReturnType<typeof this.prisma.whatsappAccount.upsert>>[]=[];
    for(const asset of selected){ if(state.accountId){ const current=await this.prisma.whatsappAccount.findFirst({where:{id:state.accountId,organizationId:ctx.organizationId,phoneNumberId:asset.phoneNumberId}}); if(!current) continue; }
      const owner=await this.prisma.whatsappAccount.findUnique({where:{phoneNumberId:asset.phoneNumberId},select:{organizationId:true}}); if(owner&&owner.organizationId!==ctx.organizationId) throw new ForbiddenException('Número já conectado a outra organização');
      const normalizedPhone=`+${asset.displayPhoneNumber.replace(/\D/g,'')}`; const account=await this.prisma.whatsappAccount.upsert({where:{phoneNumberId:asset.phoneNumberId},update:{organizationId:ctx.organizationId!,name:asset.wabaName||asset.verifiedName||asset.displayPhoneNumber,phoneNumber:asset.displayPhoneNumber,normalizedPhone,displayPhoneNumber:asset.displayPhoneNumber,verifiedName:asset.verifiedName,qualityRating:asset.qualityRating,businessAccountId:asset.wabaId,metaBusinessId:asset.businessId,metaBusinessName:asset.businessName,appId:cfg.appId,apiVersion:cfg.apiVersion,accessToken:this.crypto.encrypt(token),credentialType,tokenExpiresAt:expiresAt,tokenLastRenewedAt:new Date(),grantedScopes:inspected.scopes,status:'ACTIVE',connectedAt:new Date(),lastSyncAt:new Date(),lastConnectionError:null,deletedAt:null},create:{organizationId:ctx.organizationId!,name:asset.wabaName||asset.verifiedName||asset.displayPhoneNumber,phoneNumber:asset.displayPhoneNumber,normalizedPhone,displayPhoneNumber:asset.displayPhoneNumber,verifiedName:asset.verifiedName,phoneNumberId:asset.phoneNumberId,businessAccountId:asset.wabaId,metaBusinessId:asset.businessId,metaBusinessName:asset.businessName,appId:cfg.appId,apiVersion:cfg.apiVersion,accessToken:this.crypto.encrypt(token),verifyToken:this.crypto.encrypt(randomBytes(24).toString('hex')),credentialType,tokenExpiresAt:expiresAt,tokenLastRenewedAt:new Date(),grantedScopes:inspected.scopes,status:'ACTIVE',qualityRating:asset.qualityRating,connectedAt:new Date(),lastSyncAt:new Date(),createdByUserId:ctx.id}}); await this.syncTemplates(account.id,ctx.organizationId!,asset.wabaId,token); accounts.push(account); if(state.accountId) break; }
    if(state.accountId&&!accounts.length) throw new BadRequestException('O número reconectado não pertence à conta selecionada'); return {accountsConnected:accounts.length,accounts};
  }

  private async syncTemplates(accountId:string,organizationId:string,wabaId:string,token:string){ const templates=await this.meta.syncTemplates({accessToken:token,businessAccountId:wabaId}); for(const item of templates) await this.upsertTemplate(accountId,organizationId,item); }
  private upsertTemplate(accountId:string,organizationId:string,t:MetaTemplate){ const status=['DRAFT','PENDING','APPROVED','REJECTED','DISABLED'].includes(t.status)?t.status:'DISABLED'; return this.prisma.whatsappTemplate.upsert({where:{organizationId_whatsappAccountId_name_language:{organizationId,whatsappAccountId:accountId,name:t.name,language:t.language}},update:{externalTemplateId:t.id,metaTemplateId:t.id,displayName:t.name,metaName:t.name,category:t.category,status:status as never,components:t.components as Prisma.InputJsonValue,body:JSON.stringify(t.components),lastSyncedAt:new Date(),deletedAt:null},create:{organizationId,whatsappAccountId:accountId,externalTemplateId:t.id,metaTemplateId:t.id,name:t.name,displayName:t.name,metaName:t.name,category:t.category,language:t.language,status:status as never,components:t.components as Prisma.InputJsonValue,body:JSON.stringify(t.components),lastSyncedAt:new Date()}}); }
}
