import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';

export const getOverview = async (clinicId: string, providerId?: string) => {
  const appointmentWhere: Prisma.AppointmentWhereInput = {
    clinicId,
    ...(providerId ? { providerId } : {}),
  };

  const invoiceWhere: Prisma.InvoiceWhereInput = {
    clinicId,
    status: 'PAID',
    ...(providerId ? { providerId } : {}),
  };

  const treatmentPlanWhere: Prisma.TreatmentPlanWhereInput = {
    clinicId,
    ...(providerId ? { providerId } : {}),
  };

  const visitRecordWhere: Prisma.VisitRecordWhereInput = {
    clinicId,
    status: 'FINAL',
    ...(providerId ? { providerId } : {}),
  };

  const [
    allAppointments,
    appointmentCount, 
    revenueResult, 
    treatmentPlanStats, 
    visitCount,
    cancelledCount,
    noShowCount,
    totalDurationResult
  ] = await Promise.all([
      prisma.appointment.findMany({
        where: appointmentWhere,
        select: { startTime: true, endTime: true, status: true },
      }),
      prisma.appointment.count({
        where: {
          ...appointmentWhere,
          status: { notIn: ['CANCELLED'] },
        },
      }),
      prisma.invoice.aggregate({
        where: invoiceWhere,
        _sum: { totalAmount: true },
      }),
      prisma.treatmentPlan.groupBy({
        by: ['status'],
        where: treatmentPlanWhere,
        _count: true,
      }),
      prisma.visitRecord.count({
        where: visitRecordWhere,
      }),
      prisma.appointment.count({
        where: {
          ...appointmentWhere,
          status: 'CANCELLED',
        },
      }),
      prisma.appointment.count({
        where: {
          ...appointmentWhere,
          status: 'NO_SHOW',
        },
      }),
      prisma.appointment.aggregate({
        where: {
          ...appointmentWhere,
          status: 'COMPLETED',
        },
        _sum: {
          // Duration logic will be computed manually from startTime and endTime 
          // because prisma doesn't support date diff aggregation directly easily here
        }
      })
    ]);

  const totalAppointmentsWithCancelled = allAppointments.length;
  
  let totalDurationMinutes = 0;
  let completedCount = 0;
  for (const appt of allAppointments) {
    if (appt.status === 'COMPLETED' || appt.status === 'CONFIRMED') {
      const diffMs = appt.endTime.getTime() - appt.startTime.getTime();
      totalDurationMinutes += diffMs / (1000 * 60);
      completedCount++;
    }
  }

  const averageAppointmentDuration = completedCount > 0 ? (totalDurationMinutes / completedCount) : 0;
  const cancellationRate = totalAppointmentsWithCancelled > 0 ? (cancelledCount / totalAppointmentsWithCancelled) * 100 : 0;
  const noShowRate = totalAppointmentsWithCancelled > 0 ? (noShowCount / totalAppointmentsWithCancelled) * 100 : 0;

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
    cancellationRate,
    noShowRate,
    averageAppointmentDuration,
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
      const name = item.service?.name ?? 'Unknown Service';
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

export const getCommerceAnalytics = async (clinicId: string) => {
  const productSales = await prisma.invoiceItem.findMany({
    where: {
      invoice: { clinicId, status: 'PAID' },
      productId: { not: null },
    },
    include: { product: true }
  });

  const totalProductRevenue = productSales.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const totalProductSalesCount = productSales.reduce((sum, item) => sum + item.quantity, 0);

  const topProducts = productSales.reduce((acc, item) => {
    const name = item.product?.name ?? 'Unknown Product';
    if (!acc[name]) acc[name] = { productName: name, revenue: 0, quantity: 0 };
    acc[name].revenue += Number(item.totalPrice);
    acc[name].quantity += item.quantity;
    return acc;
  }, {} as Record<string, { productName: string, revenue: number, quantity: number }>);

  return {
    totalProductRevenue,
    totalProductSalesCount,
    topProducts: Object.values(topProducts).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
  };
};

export const getMembershipAnalytics = async (clinicId: string) => {
  const activeMemberships = await prisma.patientSubscription.count({
    where: { clinicId, status: 'ACTIVE' },
  });

  const canceledMemberships = await prisma.patientSubscription.count({
    where: { clinicId, status: 'CANCELED' },
  });

  const churnRate = (activeMemberships + canceledMemberships) > 0 
    ? (canceledMemberships / (activeMemberships + canceledMemberships)) * 100 
    : 0;

  return {
    activeMemberships,
    canceledMemberships,
    churnRate
  };
};
