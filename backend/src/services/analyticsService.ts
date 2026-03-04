import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';

export const getOverview = async (clinicId: string) => {
  const [appointmentCount, revenueResult, treatmentPlanStats, visitCount] =
    await Promise.all([
      prisma.appointment.count({
        where: {
          clinicId,
          status: { notIn: ['CANCELLED'] },
        },
      }),
      prisma.invoice.aggregate({
        where: { clinicId, status: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.treatmentPlan.groupBy({
        by: ['status'],
        where: { clinicId },
        _count: true,
      }),
      prisma.visitRecord.count({
        where: {
          clinicId,
          status: 'FINAL',
        },
      }),
    ]);

  const totalRevenue = revenueResult._sum.totalAmount ?? new Prisma.Decimal(0);
  const activePlans =
    treatmentPlanStats.find((t) => t.status === 'ACTIVE')?._count ?? 0;
  const completedPlans =
    treatmentPlanStats.find((t) => t.status === 'COMPLETED')?._count ?? 0;

  return {
    totalAppointments: appointmentCount,
    totalRevenue: Number(totalRevenue),
    activeTreatmentPlans: activePlans,
    completedTreatmentPlans: completedPlans,
    completedVisits: visitCount,
  };
};

export const getRevenueByService = async (clinicId: string) => {
  const items = await prisma.invoiceItem.findMany({
    where: {
      invoice: {
        clinicId,
        status: 'PAID',
      },
    },
    include: {
      service: { select: { id: true, name: true } },
    },
  });

  const byService = items.reduce(
    (acc, item) => {
      const name = item.service.name;
      if (!acc[name]) acc[name] = { serviceName: name, total: 0 };
      acc[name].total += Number(item.totalPrice);
      return acc;
    },
    {} as Record<string, { serviceName: string; total: number }>
  );

  return Object.values(byService).sort((a, b) => b.total - a.total);
};

export const getRevenueByProvider = async (clinicId: string) => {
  const invoices = await prisma.invoice.findMany({
    where: { clinicId, status: 'PAID' },
    include: {
      provider: { select: { id: true, firstName: true, lastName: true } },
      items: true,
    },
  });

  const byProvider = invoices.reduce(
    (acc, inv) => {
      const name = `${inv.provider.firstName} ${inv.provider.lastName}`;
      if (!acc[name]) acc[name] = { providerName: name, total: 0 };
      acc[name].total += inv.items.reduce(
        (s, i) => s + Number(i.totalPrice),
        0
      );
      return acc;
    },
    {} as Record<string, { providerName: string; total: number }>
  );

  return Object.values(byProvider).sort((a, b) => b.total - a.total);
};

export const getAppointmentsByDiscipline = async (clinicId: string) => {
  const result = await prisma.appointment.groupBy({
    by: ['serviceId'],
    where: {
      clinicId,
      status: { notIn: ['CANCELLED'] },
    },
    _count: true,
  });

  const serviceIds = result.map((r) => r.serviceId);
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    include: { discipline: { select: { id: true, name: true } } },
  });

  const byDiscipline = result.reduce(
    (acc, r) => {
      const svc = services.find((s) => s.id === r.serviceId);
      const name = svc?.discipline?.name ?? 'Unknown';
      if (!acc[name]) acc[name] = { disciplineName: name, count: 0 };
      acc[name].count += r._count;
      return acc;
    },
    {} as Record<string, { disciplineName: string; count: number }>
  );

  return Object.values(byDiscipline).sort((a, b) => b.count - a.count);
};
