import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { getJwtAccessSecret } from './jwt-env';

export interface JwtPayload { sub: string; email: string; role: string; organizationId?: string | null; sid?: string }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private readonly prisma: PrismaService) {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: getJwtAccessSecret({ JWT_ACCESS_SECRET: configService.get<string>('JWT_ACCESS_SECRET'), JWT_REFRESH_SECRET: configService.get<string>('JWT_REFRESH_SECRET') }) });
  }
  async validate(payload: JwtPayload) {
    if (payload.sid) {
      const session = await this.prisma.authSession.findFirst({ where: { id: payload.sid, userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } } });
      if (!session) throw new UnauthorizedException('Sessão inválida');
    }
    return { id: payload.sub, email: payload.email, role: payload.role, organizationId: payload.organizationId, sessionId: payload.sid };
  }
}
