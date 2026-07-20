import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { ListOrganizationsDto } from './dto/list-organizations.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrganizationDto) {
    return this.prisma.organization.create({ data });
  }

  async findAll(query: ListOrganizationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.OrganizationWhereInput = {
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.organization.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findFirst({ where: { id, deletedAt: null } });

    if (!organization) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return organization;
  }

  async update(id: string, data: UpdateOrganizationDto) {
    await this.findOne(id);
    return this.prisma.organization.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.organization.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
  }
}
