import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  active: true,
  organization: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, query: ListUsersDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.UserWhereInput = {
      organizationId,
      deletedAt: null,
      ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { email: { contains: query.search, mode: 'insensitive' } }] } : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, select: userSelect, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.user.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(organizationId: string, id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, organizationId, deletedAt: null }, select: userSelect });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async findByEmail(email: string) { return this.prisma.user.findFirst({ where: { email, deletedAt: null } }); }

  async create(data: CreateUserDto | { name: string; email: string; password: string; role?: Role }, organizationId?: string | null) {
    await this.ensureEmailAvailable(data.email);
    if (organizationId) await this.ensureOrganization(organizationId);
    const password = data.password.startsWith('$2') ? data.password : await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({ data: { ...data, organizationId, password, role: data.role ?? Role.CORRETOR }, select: userSelect });
  }

  async update(organizationId: string, id: string, data: UpdateUserDto) {
    await this.findOne(organizationId, id);
    if (data.email) await this.ensureEmailAvailable(data.email, id);
    return this.prisma.user.update({ where: { id }, data, select: userSelect });
  }

  async updateStatus(organizationId: string, id: string, active: boolean) {
    await this.findOne(organizationId, id);
    return this.prisma.user.update({ where: { id }, data: { active }, select: userSelect });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), active: false }, select: userSelect });
  }

  private async ensureEmailAvailable(email: string, ignoreId?: string) {
    const existing = await this.prisma.user.findFirst({ where: { email, deletedAt: null, ...(ignoreId ? { id: { not: ignoreId } } : {}) }, select: { id: true } });
    if (existing) throw new ConflictException('E-mail já cadastrado');
  }

  private async ensureOrganization(id: string) {
    const organization = await this.prisma.organization.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!organization) throw new NotFoundException('Empresa não encontrada');
  }
}
