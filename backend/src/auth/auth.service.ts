import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthAuditEventType, RefreshTokenStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { getJwtAccessSecret } from './jwt-env';
import { PasswordService } from './security/password.service';

type RequestMeta = { ip?: string; userAgent?: string; device?: string };

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService, private prisma: PrismaService, private config: ConfigService, private passwords: PasswordService) {}

  async register(data: RegisterDto) {
    const password = await this.passwords.hash(data.password);
    const user = await this.usersService.create({ name: data.name, email: data.email, password, role: 'ADMIN' });
    return { id: user.id, name: user.name, email: user.email };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.active || user.deletedAt || !(await this.passwords.verify(user.password, password))) throw new UnauthorizedException('Credenciais inválidas');
    return user;
  }

  async login(data: LoginDto, meta: RequestMeta = {}) {
    try {
      const user = await this.validateUser(data.email, data.password);
      const session = await this.prisma.authSession.create({ data: { userId: user.id, expiresAt: this.refreshExpiry(), device: meta.device, ipAddress: meta.ip, userAgent: meta.userAgent } });
      const tokens = await this.issueTokens(user, session.id);
      await this.audit(AuthAuditEventType.LOGIN_SUCCESS, user.id, user.organizationId, true, meta);
      const { refreshTokenId: _refreshTokenId, ...publicTokens } = tokens;
      return { ...publicTokens, user: { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId } };
    } catch (error) {
      await this.audit(AuthAuditEventType.LOGIN_FAILURE, undefined, undefined, false, meta, 'invalid_credentials');
      throw error;
    }
  }

  async refresh(data: RefreshDto, meta: RequestMeta = {}) {
    const hash = this.passwords.tokenHash(data.refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash }, include: { user: true, session: true } });
    if (!stored || stored.status !== RefreshTokenStatus.ACTIVE || stored.expiresAt <= new Date() || stored.session.revokedAt || !stored.user.active || stored.user.deletedAt) {
      await this.audit(AuthAuditEventType.REFRESH_FAILURE, stored?.userId, stored?.user.organizationId, false, meta, 'invalid_refresh_token');
      throw new UnauthorizedException('Refresh token inválido');
    }
    const tokens = await this.issueTokens(stored.user, stored.sessionId);
    await this.prisma.$transaction([
      this.prisma.refreshToken.update({ where: { id: stored.id }, data: { status: RefreshTokenStatus.ROTATED, lastUsedAt: new Date(), replacedByTokenId: tokens.refreshTokenId } }),
      this.prisma.authSession.update({ where: { id: stored.sessionId }, data: { lastAccessedAt: new Date(), ipAddress: meta.ip, userAgent: meta.userAgent } }),
    ]);
    await this.audit(AuthAuditEventType.REFRESH_SUCCESS, stored.userId, stored.user.organizationId, true, meta);
    const { refreshTokenId: _refreshTokenId, ...publicTokens } = tokens;
    return publicTokens;
  }

  async logout(userId: string, data: LogoutDto, meta: RequestMeta = {}, sessionId?: string) {
    if (data.allDevices) return this.logoutAll(userId, meta);
    if (data.refreshToken) {
      const token = await this.prisma.refreshToken.findUnique({ where: { tokenHash: this.passwords.tokenHash(data.refreshToken) } });
      if (token?.userId === userId) await this.revokeSession(token.sessionId);
    } else if (sessionId) {
      await this.revokeSession(sessionId);
    }
    await this.audit(AuthAuditEventType.LOGOUT, userId, undefined, true, meta);
    return { success: true };
  }

  async logoutAll(userId: string, meta: RequestMeta = {}) {
    const sessions = await this.prisma.authSession.findMany({ where: { userId, revokedAt: null }, select: { id: true } });
    await Promise.all(sessions.map((s) => this.revokeSession(s.id)));
    await this.audit(AuthAuditEventType.LOGOUT_ALL, userId, undefined, true, meta);
    return { success: true };
  }

  async changePassword(userId: string, data: ChangePasswordDto, meta: RequestMeta = {}) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await this.passwords.verify(user.password, data.currentPassword))) throw new UnauthorizedException('Senha atual inválida');
    await this.prisma.user.update({ where: { id: userId }, data: { password: await this.passwords.hash(data.newPassword) } });
    await this.logoutAll(userId, meta);
    await this.audit(AuthAuditEventType.PASSWORD_CHANGED, userId, user.organizationId, true, meta);
    return { success: true };
  }

  async sessions(userId: string) {
    return this.prisma.authSession.findMany({ where: { userId, revokedAt: null, expiresAt: { gt: new Date() } }, select: { id: true, createdAt: true, lastAccessedAt: true, expiresAt: true, device: true, ipAddress: true, userAgent: true }, orderBy: { lastAccessedAt: 'desc' } });
  }

  private async issueTokens(user: { id: string; email: string; role: string; organizationId: string | null }, sessionId: string) {
    const refreshToken = randomBytes(48).toString('base64url');
    const accessToken = await this.jwtService.signAsync({ sub: user.id, email: user.email, role: user.role, organizationId: user.organizationId, sid: sessionId }, { secret: getJwtAccessSecret(this.configEnv()), expiresIn: this.config.get('JWT_ACCESS_TTL') ?? '15m' });
    const record = await this.prisma.refreshToken.create({ data: { userId: user.id, sessionId, tokenHash: this.passwords.tokenHash(refreshToken), expiresAt: this.refreshExpiry() } });
    return { accessToken, refreshToken, refreshTokenId: record.id, tokenType: 'Bearer', expiresIn: this.config.get('JWT_ACCESS_TTL') ?? '15m' };
  }

  private async revokeSession(sessionId: string) {
    await this.prisma.$transaction([
      this.prisma.authSession.update({ where: { id: sessionId }, data: { revokedAt: new Date() } }),
      this.prisma.refreshToken.updateMany({ where: { sessionId, status: RefreshTokenStatus.ACTIVE }, data: { status: RefreshTokenStatus.REVOKED, revokedAt: new Date() } }),
    ]);
  }

  private refreshExpiry() { return new Date(Date.now() + Number(this.config.get('JWT_REFRESH_TTL_DAYS') ?? 30) * 86400000); }
  private configEnv() { return { JWT_ACCESS_SECRET: this.config.get<string>('JWT_ACCESS_SECRET'), JWT_REFRESH_SECRET: this.config.get<string>('JWT_REFRESH_SECRET') }; }
  private async audit(eventType: AuthAuditEventType, userId?: string, organizationId?: string | null, success = true, meta: RequestMeta = {}, reason?: string) { await this.prisma.authAuditLog.create({ data: { eventType, userId, organizationId, success, ipAddress: meta.ip, userAgent: meta.userAgent, reason } }); }
}
