import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const exists = await this.usersService.findByEmail(data.email);

    if (exists) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const password = await bcrypt.hash(data.password, 10);

    const user = await this.usersService.create({
      name: data.name,
      email: data.email,
      password,
      role: 'ADMIN',
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  async login(data: LoginDto) {
    const user = await this.usersService.findByEmail(data.email);

    if (!user || !user.active || user.deletedAt) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await bcrypt.compare(data.password, user.password);

    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }
}