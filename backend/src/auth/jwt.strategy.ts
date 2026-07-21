import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { getJwtAccessSecret } from './jwt-env';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organizationId?: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtAccessSecret({
        JWT_ACCESS_SECRET: configService.get<string>('JWT_ACCESS_SECRET'),
        JWT_REFRESH_SECRET: configService.get<string>('JWT_REFRESH_SECRET'),
      }),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.organizationId !== undefined) return { id: payload.sub, email: payload.email, role: payload.role, organizationId: payload.organizationId };
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { organizationId: true } });
    return { id: payload.sub, email: payload.email, role: payload.role, organizationId: user?.organizationId ?? null };
  }
}
