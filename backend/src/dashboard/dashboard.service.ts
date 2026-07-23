import { ForbiddenException, Injectable } from '@nestjs/common';
import { CampaignStatus, Prisma, WhatsappAccountStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const campaignStatuses: CampaignStatus[] = [
  'DRAFT',
  'SCHEDULED',
  'PROCESSING',
  'PAUSED',
  'COMPLETED',
  'CANCELED',
  'FAILED',
];

const whatsappAccountStatuses: WhatsappAccountStatus[] = [
  'PENDING',
  'CONNECTED',
  'DISCONNECTED',
  'ERROR',
  'SUSPENDED',
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const organizationId = await this.getOrganizationId(userId);
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
    const sevenDaysStart = new Date(todayStart);
    sevenDaysStart.setDate(todayStart.getDate() - 6);

    const leadWhere = { organizationId, deletedAt: null } satisfies Prisma.LeadWhereInput;
    const campaignWhere = { organizationId, deletedAt: null } satisfies Prisma.CampaignWhereInput;
    const whatsappWhere = { organizationId, deletedAt: null } satisfies Prisma.WhatsappAccountWhereInput;

    const [
      totalLeads,
      leadsToday,
      leadsThisWeek,
      totalCampaigns,
      campaignsByStatusRaw,
      whatsappByStatusRaw,
      campaignMetrics,
      leadsForChart,
      recentLeads,
      recentCampaigns,
      scheduledCampaigns,
      whatsappAccounts,
      topLeadGroups,
    ] = await Promise.all([
      this.prisma.lead.count({ where: leadWhere }),
      this.prisma.lead.count({ where: { ...leadWhere, createdAt: { gte: todayStart } } }),
      this.prisma.lead.count({ where: { ...leadWhere, createdAt: { gte: weekStart } } }),
      this.prisma.campaign.count({ where: campaignWhere }),
      this.prisma.campaign.groupBy({ by: ['status'], where: campaignWhere, _count: { _all: true } }),
      this.prisma.whatsappAccount.groupBy({ by: ['status'], where: whatsappWhere, _count: { _all: true } }),
      this.prisma.campaign.aggregate({
        where: campaignWhere,
        _sum: {
          totalContacts: true,
          totalSent: true,
          totalDelivered: true,
          totalRead: true,
          totalFailed: true,
          totalClicked: true,
        },
      }),
      this.prisma.lead.findMany({ where: { ...leadWhere, createdAt: { gte: sevenDaysStart } }, select: { createdAt: true } }),
      this.prisma.lead.findMany({
        where: leadWhere,
        select: { id: true, name: true, phone: true, email: true, status: true, source: true, createdAt: true, assignedUser: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.campaign.findMany({
        where: campaignWhere,
        select: { id: true, name: true, status: true, scheduledAt: true, totalContacts: true, totalSent: true, totalDelivered: true, totalRead: true, totalFailed: true, totalClicked: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.campaign.findMany({
        where: { ...campaignWhere, status: 'SCHEDULED', scheduledAt: { gte: now } },
        select: { id: true, name: true, status: true, scheduledAt: true, totalContacts: true, totalSent: true, totalDelivered: true, totalRead: true, totalFailed: true, totalClicked: true, createdAt: true },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      }),
      this.prisma.whatsappAccount.findMany({
        where: whatsappWhere,
        select: { id: true, name: true, phoneNumber: true, status: true, connectedAt: true, lastSyncAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.lead.groupBy({ by: ['assignedUserId'], where: { ...leadWhere, assignedUserId: { not: null } }, _count: { _all: true }, orderBy: { _count: { assignedUserId: 'desc' } }, take: 5 }),
    ]);

    const topUsers = await this.getTopUsers(organizationId, topLeadGroups);
    const campaignsByStatus = this.formatCampaignStatuses(campaignsByStatusRaw);
    const whatsappCounts = this.countWhatsappStatus(whatsappByStatusRaw);
    const performance = {
      sent: campaignMetrics._sum.totalSent ?? 0,
      delivered: campaignMetrics._sum.totalDelivered ?? 0,
      read: campaignMetrics._sum.totalRead ?? 0,
      failed: campaignMetrics._sum.totalFailed ?? 0,
      clicked: campaignMetrics._sum.totalClicked ?? 0,
    };

    return {
      summary: {
        totalLeads,
        leadsToday,
        leadsThisWeek,
        totalCampaigns,
        draftCampaigns: campaignsByStatus.find((item) => item.status === 'DRAFT')?.total ?? 0,
        scheduledCampaigns: campaignsByStatus.find((item) => item.status === 'SCHEDULED')?.total ?? 0,
        completedCampaigns: campaignsByStatus.find((item) => item.status === 'COMPLETED')?.total ?? 0,
        connectedWhatsappAccounts: whatsappCounts.CONNECTED,
        disconnectedWhatsappAccounts: whatsappCounts.DISCONNECTED,
        totalRecipients: campaignMetrics._sum.totalContacts ?? 0,
        totalSent: performance.sent,
        totalDelivered: performance.delivered,
        totalRead: performance.read,
        totalFailed: performance.failed,
        totalClicked: performance.clicked,
      },
      leadsByDay: this.formatLeadsByDay(sevenDaysStart, leadsForChart),
      campaignsByStatus,
      campaignPerformance: performance,
      recentLeads,
      recentCampaigns,
      whatsappAccounts,
      scheduledCampaigns,
      topUsers,
    };
  }

  private async getOrganizationId(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, active: true, deletedAt: null, organization: { active: true, deletedAt: null } },
      select: { organizationId: true },
    });
    if (!user?.organizationId) throw new ForbiddenException('Usuário sem organização ativa');
    return user.organizationId;
  }

  private formatCampaignStatuses(grouped: { status: CampaignStatus; _count: { _all: number } }[]) {
    const totals = new Map(grouped.map((item) => [item.status, item._count._all]));
    return campaignStatuses.map((status) => ({ status, total: totals.get(status) ?? 0 }));
  }

  private countWhatsappStatus(grouped: { status: WhatsappAccountStatus; _count: { _all: number } }[]) {
    const totals = Object.fromEntries(whatsappAccountStatuses.map((status) => [status, 0])) as Record<WhatsappAccountStatus, number>;
    return grouped.reduce<Record<WhatsappAccountStatus, number>>((accumulator, item) => ({ ...accumulator, [item.status]: item._count._all }), totals);
  }

  private formatLeadsByDay(start: Date, leads: { createdAt: Date }[]) {
    const totals = new Map<string, number>();
    for (let index = 0; index < 7; index += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      totals.set(date.toISOString().slice(0, 10), 0);
    }
    leads.forEach((lead) => {
      const key = lead.createdAt.toISOString().slice(0, 10);
      totals.set(key, (totals.get(key) ?? 0) + 1);
    });
    return Array.from(totals, ([date, total]) => ({ date, total }));
  }

  private async getTopUsers(organizationId: string, groups: { assignedUserId: string | null; _count: { _all: number } }[]) {
    const userIds = groups.map((group) => group.assignedUserId).filter((id): id is string => Boolean(id));
    if (!userIds.length) return [];
    const users = await this.prisma.user.findMany({ where: { id: { in: userIds }, organizationId, active: true, deletedAt: null }, select: { id: true, name: true, email: true } });
    const usersById = new Map(users.map((user) => [user.id, user]));
    return groups.flatMap((group) => {
      if (!group.assignedUserId) return [];
      const user = usersById.get(group.assignedUserId);
      return user ? [{ ...user, totalLeads: group._count._all }] : [];
    });
  }
}
