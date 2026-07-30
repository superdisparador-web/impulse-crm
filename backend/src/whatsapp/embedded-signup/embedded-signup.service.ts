import { BadRequestException, Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { AccessContextService, AuthenticatedUserRef } from '../../auth/access-context.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappCredentialCryptoService } from '../security/credential-crypto.service';
import { WhatsappService } from '../whatsapp.service';

type MetaToken = { access_token?: string };
type MetaList<T> = { data?: T[]; paging?: { next?: string } };
type MetaBusiness = { id: string };
type MetaWaba = { id: string; name?: string };
type MetaPhone = { id: string; display_phone_number?: string; verified_name?: string; quality_rating?: string; messaging_limit_tier?: string };

@Injectable()
export class EmbeddedSignupService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddedSignupService.name);
  private readonly timeoutMs = Number(process.env.META_WHATSAPP_TIMEOUT_MS || 10_000);
  constructor(private readonly prisma: PrismaService, private readonly access: AccessContextService, private readonly crypto: WhatsappCredentialCryptoService, private readonly whatsapp: WhatsappService) {}

  onModuleInit() {
    const missing = this.missingConfig();
    if (missing.length) this.logger.warn(`Embedded Signup indisponível: configuração ausente (${missing.join(', ')})`);
    else this.config();
  }
  private missingConfig() {
    return ['META_APP_ID', 'META_APP_SECRET', 'META_CONFIG_ID', 'META_REDIRECT_URI', 'META_GRAPH_API_VERSION', 'META_TOKEN_ENCRYPTION_KEY', 'FRONTEND_URL']
      .filter(key => !process.env[key]);
  }
  private config() {
    const missing = this.missingConfig();
    if (missing.length) throw new ServiceUnavailableException({ code: 'META_EMBEDDED_SIGNUP_NOT_CONFIGURED', message: 'A conexão com a Meta ainda não foi configurada.' });
    let redirect: URL, frontend: URL;
    try { redirect = new URL(process.env.META_REDIRECT_URI!); frontend = new URL(process.env.FRONTEND_URL!); }
    catch { throw new ServiceUnavailableException({ code: 'META_EMBEDDED_SIGNUP_NOT_CONFIGURED', message: 'A configuração de conexão com a Meta é inválida.' }); }
    const local = (url: URL) => url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if ((redirect.protocol !== 'https:' && !local(redirect)) || (frontend.protocol !== 'https:' && !local(frontend)) || !/^v\d+\.\d+$/.test(process.env.META_GRAPH_API_VERSION!) || process.env.META_TOKEN_ENCRYPTION_KEY!.length < 32 || !Number.isInteger(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new ServiceUnavailableException({ code: 'META_EMBEDDED_SIGNUP_NOT_CONFIGURED', message: 'A configuração de conexão com a Meta é inválida.' });
    }
    return { appId: process.env.META_APP_ID!, appSecret: process.env.META_APP_SECRET!, configId: process.env.META_CONFIG_ID!, redirectUri: redirect.toString(), version: process.env.META_GRAPH_API_VERSION! };
  }
  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }

  async createSession(user: AuthenticatedUserRef) {
    const ctx = await this.access.resolve(user);
    if (!ctx.organizationId || ctx.global) throw new BadRequestException('WHATSAPP_ORGANIZATION_CONTEXT_REQUIRED');
    const state = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 10 * 60_000);
    await this.prisma.whatsappEmbeddedSignupState.create({ data: { stateHash: this.hash(state), organizationId: ctx.organizationId, userId: ctx.id, expiresAt } });
    const config = this.config();
    const url = new URL(`https://www.facebook.com/${config.version}/dialog/oauth`);
    url.search = new URLSearchParams({ client_id: config.appId, redirect_uri: config.redirectUri, state, config_id: config.configId, response_type: 'code', scope: 'business_management,whatsapp_business_management,whatsapp_business_messaging' }).toString();
    return { authorizationUrl: url.toString(), expiresAt: expiresAt.toISOString() };
  }

  async complete(query: { code?: string; state?: string; error?: string; error_reason?: string }) {
    if (!query.state) return this.redirect('error', 'invalid_state');
    const stateHash = this.hash(query.state);
    const consumed = await this.prisma.whatsappEmbeddedSignupState.updateMany({ where: { stateHash, usedAt: null, expiresAt: { gt: new Date() }, authorizationCodeHash: null, user: { active: true, deletedAt: null }, organization: { active: true, deletedAt: null } }, data: { usedAt: new Date(), ...(query.code ? { authorizationCodeHash: this.hash(query.code) } : {}) } }).catch(() => ({ count: 0 }));
    if (consumed.count !== 1) return this.redirect('error', 'invalid_state');
    if (query.error) return this.redirect('error', query.error === 'access_denied' || query.error_reason === 'user_denied' ? 'cancelled' : 'failed');
    if (!query.code) return this.redirect('error', 'missing_code');
    const state = await this.prisma.whatsappEmbeddedSignupState.findUnique({ where: { stateHash } });
    if (!state) return this.redirect('error', 'invalid_state');
    try {
      const token = await this.exchangeCode(query.code);
      const connected = await this.discover(token);
      const account = await this.persist(state.organizationId, state.userId, token, connected);
      await this.subscribe(token, connected.waba.id);
      await this.whatsapp.syncTemplates({ whatsappAccountId: account.id }, { id: state.userId } as AuthenticatedUserRef);
      return this.redirect('success');
    } catch (error) {
      this.logger.error(`Embedded Signup falhou (${this.safeCode(error)})`);
      return this.redirect('error', this.reason(error));
    }
  }

  async diagnostics() {
    const present = (key: string) => Boolean(process.env[key]?.trim());
    let databaseTableAccessible = false;
    try { await this.prisma.whatsappEmbeddedSignupState.count({ take: 1 }); databaseTableAccessible = true; } catch { /* expose only a safe boolean */ }
    const flags = { appIdConfigured: present('META_APP_ID'), appSecretConfigured: present('META_APP_SECRET'), configIdConfigured: present('META_CONFIG_ID'), redirectUriConfigured: present('META_REDIRECT_URI'), encryptionKeyConfigured: present('META_TOKEN_ENCRYPTION_KEY'), frontendUrlConfigured: present('FRONTEND_URL') };
    const warnings: string[] = [];
    for (const [name, configured] of Object.entries(flags)) if (!configured) warnings.push(`${name} is not configured`);
    if (!databaseTableAccessible) warnings.push('Embedded Signup state table is not accessible');
    try { this.config(); } catch { warnings.push('Embedded Signup configuration is invalid'); }
    return { configured: Object.values(flags).every(Boolean) && databaseTableAccessible && warnings.length === 0, ...flags, graphApiVersion: process.env.META_GRAPH_API_VERSION || null, callbackRouteRegistered: true, databaseTableAccessible, environment: process.env.NODE_ENV || 'development', warnings };
  }

  private async exchangeCode(code: string) {
    const c = this.config();
    const url = new URL(`https://graph.facebook.com/${c.version}/oauth/access_token`);
    url.search = new URLSearchParams({ client_id: c.appId, client_secret: c.appSecret, redirect_uri: c.redirectUri, code }).toString();
    const result = await this.request<MetaToken>(url, { method: 'GET' }, false);
    if (!result.access_token) throw Object.assign(new Error('Token ausente'), { code: 'TOKEN_INVALID' });
    return result.access_token;
  }
  private async discover(token: string) {
    const c = this.config();
    const businesses = await this.graph<MetaList<MetaBusiness>>('/me/businesses?fields=id&limit=100', token);
    for (const business of businesses.data || []) {
      const wabas = await this.graph<MetaList<MetaWaba>>(`/${business.id}/owned_whatsapp_business_accounts?fields=id,name&limit=100`, token);
      for (const waba of wabas.data || []) {
        const phones = await this.graph<MetaList<MetaPhone>>(`/${waba.id}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,messaging_limit_tier&limit=100`, token);
        if (phones.data?.[0]) return { business, waba, phone: phones.data[0], version: c.version };
      }
    }
    throw Object.assign(new Error('Nenhuma WABA disponível'), { code: 'NO_WABA' });
  }
  private async subscribe(token: string, wabaId: string) { await this.graph(`/${wabaId}/subscribed_apps`, token, { method: 'POST' }); }
  private async persist(org: string, userId: string, token: string, d: { business: MetaBusiness; waba: MetaWaba; phone: MetaPhone; version: string }) {
    const digits = (d.phone.display_phone_number || '').replace(/\D/g, '');
    const verifyToken = randomBytes(24).toString('hex');
    const data = { organizationId: org, name: d.waba.name || d.phone.verified_name || 'WhatsApp Oficial', provider: 'META_CLOUD' as never, wabaId: d.waba.id, businessAccountId: d.business.id, phoneNumberId: d.phone.id, phoneNumber: d.phone.display_phone_number || digits, normalizedPhone: digits ? `+${digits}` : '', displayPhoneNumber: d.phone.display_phone_number, verifiedName: d.phone.verified_name, qualityRating: d.phone.quality_rating, messagingLimitTier: d.phone.messaging_limit_tier, appId: process.env.META_APP_ID, appSecret: this.crypto.encrypt(process.env.META_APP_SECRET!), apiVersion: d.version, accessToken: this.crypto.encrypt(token), tokenLast4: token.slice(-4), verifyToken: this.crypto.encrypt(verifyToken), verifyTokenHash: this.hash(verifyToken), status: 'ACTIVE' as never, tokenConfigured: true, connectedAt: new Date(), lastSyncAt: new Date(), lastConnectionTestAt: new Date(), lastConnectionError: null, webhookSubscribedAt: new Date(), deletedAt: null, createdByUserId: userId };
    const { organizationId: _organizationId, createdByUserId: _createdByUserId, ...safeUpdate } = data;
    return this.prisma.$transaction(async tx => {
      const existing = await tx.whatsappAccount.findUnique({ where: { phoneNumberId: d.phone.id }, select: { organizationId: true } });
      if (existing && existing.organizationId !== org) throw Object.assign(new Error('Número já pertence a outra organização'), { code: 'PHONE_IN_USE' });
      return tx.whatsappAccount.upsert({ where: { phoneNumberId: d.phone.id }, create: data, update: safeUpdate, select: { id: true } });
    }, { isolationLevel: 'Serializable' });
  }
  private graph<T = unknown>(path: string, token: string, init: RequestInit = {}) { const c = this.config(); return this.request<T>(new URL(`https://graph.facebook.com/${c.version}${path}`), { ...init, headers: { authorization: `Bearer ${token}`, ...(init.headers || {}) } }, !init.method || init.method === 'GET'); }
  private async request<T>(url: URL, init: RequestInit, retrySafe = false): Promise<T> {
    if (url.protocol !== 'https:' || url.hostname !== 'graph.facebook.com') throw Object.assign(new Error('Meta URL recusada'), { code: 'META_URL_INVALID' });
    for (let attempt = 0; ; attempt++) {
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(url, { ...init, signal: controller.signal });
        const body = await response.json().catch(() => ({})) as { error?: { code?: number } };
        if (response.ok) return body as T;
        const code = response.status === 429 ? 'RATE_LIMIT' : response.status === 401 || body.error?.code === 190 ? 'TOKEN_INVALID' : response.status === 403 ? 'PERMISSION_DENIED' : response.status >= 500 ? 'META_TEMPORARY' : 'META_REQUEST_INVALID';
        if (retrySafe && attempt < 2 && (response.status === 429 || response.status >= 500)) { await new Promise(resolve => setTimeout(resolve, 100 * 2 ** attempt)); continue; }
        throw Object.assign(new Error('Meta API request failed'), { code });
      } catch (error) {
        if ((error as Error).name === 'AbortError') throw Object.assign(new Error('Meta API timeout'), { code: 'META_TIMEOUT' });
        throw error;
      } finally { clearTimeout(timeout); }
    }
  }
  private redirect(connection: 'success' | 'error', reason?: string) { const base = new URL('/whatsapp', process.env.FRONTEND_URL || 'http://localhost:3000'); base.searchParams.set('connection', connection); if (reason) base.searchParams.set('reason', reason); return base.toString(); }
  private safeCode(error: unknown) { return typeof error === 'object' && error && 'code' in error ? String(error.code).slice(0, 40) : 'UNKNOWN'; }
  private reason(error: unknown) { const code = this.safeCode(error); return code === 'NO_WABA' ? 'no_waba' : code === 'PHONE_IN_USE' ? 'phone_in_use' : code === 'RATE_LIMIT' ? 'temporarily_unavailable' : code === 'TOKEN_INVALID' ? 'permission_denied' : 'failed'; }
}
