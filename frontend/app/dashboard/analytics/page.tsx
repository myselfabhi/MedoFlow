'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  downloadAnalyticsReport,
  getAnalyticsDashboard,
  type AnalyticsExportType,
  type ClinicDashboardResponse,
  type ProviderDashboardResponse,
} from '@/lib/analyticsApi';
import { listProviders } from '@/lib/availabilityApi';
import {
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
  AppEmptyState,
  AppPageHeader,
} from '@/components/ui-system';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

function formatMoney(value?: number | string | null) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatPercent(value?: number | null) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

const defaultDateRange = () => {
  const today = new Date();
  const to = new Date(today);
  const from = new Date(today);
  from.setDate(today.getDate() - 29);
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  };
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? undefined;
  const isProvider = user?.role === 'PROVIDER';
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const [filters, setFilters] = React.useState({
    ...defaultDateRange(),
    providerId: 'ALL',
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => listProviders(),
    enabled: !!clinicId && !isProvider,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics-dashboard', filters],
    queryFn: () =>
      getAnalyticsDashboard({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        providerId: !isProvider && filters.providerId !== 'ALL' ? filters.providerId : undefined,
      }),
    enabled: !!clinicId,
  });

  if (!clinicId) {
    return (
      <div className="space-y-6">
        <AppPageHeader title="Analytics" description="Clinic command center and provider performance." />
        <AppEmptyState
          title="No clinic assigned"
          description="You are not assigned to a clinic. Contact your administrator."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <AppPageHeader title="Analytics" description="Clinic command center and provider performance." />
        <AppEmptyState
          title="Analytics unavailable"
          description="The analytics dashboard could not be loaded right now."
        />
      </div>
    );
  }

  const isClinicMode = data.mode === 'clinic';
  const clinicData = isClinicMode ? (data as ClinicDashboardResponse).dashboard : null;
  const providerData = !isClinicMode ? (data as ProviderDashboardResponse).providerAnalytics : null;

  const exportType: AnalyticsExportType = isClinicMode ? 'command-center' : 'provider';

  return (
    <div className="space-y-8">
      <AppPageHeader
        title={isProvider ? 'Provider Analytics' : 'Clinic Analytics'}
        description={
          isProvider
            ? 'Personal performance, follow-up behavior, utilization, and commissions.'
            : 'Operational command center built from real appointments, ledger, membership, package, and commission data.'
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
          />
          {!isProvider && (
            <Select
              value={filters.providerId}
              onValueChange={(value) => setFilters((current) => ({ ...current, providerId: value }))}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="All providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All providers</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.firstName} {provider.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <select
          className="rounded-md border border-border bg-background px-2 py-2 text-sm"
          defaultValue=""
          onChange={(event) => {
            const type = event.target.value as AnalyticsExportType;
            if (!type) return;
            void downloadAnalyticsReport(type, {
              dateFrom: filters.dateFrom,
              dateTo: filters.dateTo,
              providerId: !isProvider && filters.providerId !== 'ALL' ? filters.providerId : undefined,
            });
            event.currentTarget.selectedIndex = 0;
          }}
        >
          <option value="" disabled>
            Export report…
          </option>
          <option value={exportType}>{isProvider ? 'Provider Summary' : 'Command Center'}</option>
          {isClinicMode && (
            <>
              <option value="finance">Finance Summary</option>
              <option value="commerce">Commerce Summary</option>
              <option value="patients">Patient Value Summary</option>
              {isAdmin && <option value="commissions">Commission Summary</option>}
            </>
          )}
        </select>
      </div>

      {isClinicMode && clinicData && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Total Revenue</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="text-3xl font-semibold">{formatMoney(clinicData.commandCenter.finance.totalRevenue)}</AppCardContent>
            </AppCard>
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Net Collected</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="text-3xl font-semibold text-emerald-700">
                {formatMoney(clinicData.commandCenter.finance.netCollectedRevenue)}
              </AppCardContent>
            </AppCard>
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Refunded</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="text-3xl font-semibold">
                {formatMoney(clinicData.commandCenter.finance.refundedAmount)}
              </AppCardContent>
            </AppCard>
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Outstanding AR</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="text-3xl font-semibold text-amber-700">
                {formatMoney(clinicData.commandCenter.finance.outstandingReceivables)}
              </AppCardContent>
            </AppCard>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Total Appointments</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="text-3xl font-semibold">
                {clinicData.commandCenter.operations.totalAppointments}
              </AppCardContent>
            </AppCard>
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Completed</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="text-3xl font-semibold">
                {clinicData.commandCenter.operations.completedAppointments}
              </AppCardContent>
            </AppCard>
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Cancellation Rate</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="text-3xl font-semibold">
                {formatPercent(clinicData.commandCenter.operations.cancellationRate)}
              </AppCardContent>
            </AppCard>
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>No-show Rate</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="text-3xl font-semibold">
                {formatPercent(clinicData.commandCenter.operations.noShowRate)}
              </AppCardContent>
            </AppCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Business Alerts</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="space-y-3">
                {clinicData.commandCenter.alerts.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No material alerts for the selected period.</div>
                ) : (
                  clinicData.commandCenter.alerts.map((alert) => (
                    <div key={alert.id} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={
                            alert.severity === 'critical'
                              ? 'CANCELLED'
                              : alert.severity === 'warning'
                                ? 'UNPAID'
                                : 'CONFIRMED'
                          }
                          variant="invoice"
                        />
                        <div className="font-medium">{alert.title}</div>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">{alert.message}</div>
                    </div>
                  ))
                )}
              </AppCardContent>
            </AppCard>

            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Operational Summary</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="space-y-3 text-sm text-slate-700">
                <div className="flex justify-between"><span>Average appointment duration</span><span>{clinicData.commandCenter.operations.averageAppointmentDuration.toFixed(0)} min</span></div>
                <div className="flex justify-between"><span>Upcoming load (7 days)</span><span>{clinicData.commandCenter.operations.upcomingLoadCount}</span></div>
                <div className="flex justify-between"><span>Waitlist entries</span><span>{clinicData.commandCenter.operations.waitlistCount}</span></div>
                <div className="flex justify-between"><span>Waitlist booked</span><span>{clinicData.commandCenter.operations.waitlistBookedCount}</span></div>
                <div className="flex justify-between"><span>Waitlist conversion</span><span>{formatPercent(clinicData.commandCenter.operations.waitlistConversionRate)}</span></div>
                <div className="flex justify-between"><span>Avg revenue per patient</span><span>{formatMoney(clinicData.commandCenter.finance.averageRevenuePerPatient)}</span></div>
                <div className="flex justify-between"><span>Avg revenue per visit</span><span>{formatMoney(clinicData.commandCenter.finance.averageRevenuePerVisit)}</span></div>
              </AppCardContent>
            </AppCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Top Services</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="space-y-3">
                {clinicData.commandCenter.topServices.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No service revenue in this period.</div>
                ) : (
                  clinicData.commandCenter.topServices.map((service) => (
                    <div key={service.serviceId} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{service.serviceName}</div>
                        <div className="text-sm text-slate-600">{service.count} booked line items</div>
                      </div>
                      <div className="font-semibold">{formatMoney(service.revenue)}</div>
                    </div>
                  ))
                )}
              </AppCardContent>
            </AppCard>

            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Top Products</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="space-y-3">
                {clinicData.commandCenter.commerce.topProducts.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No product sales in this period.</div>
                ) : (
                  clinicData.commandCenter.commerce.topProducts.map((product) => (
                    <div key={product.productId} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{product.productName}</div>
                        <div className="text-sm text-slate-600">{product.quantity} units</div>
                      </div>
                      <div className="font-semibold">{formatMoney(product.revenue)}</div>
                    </div>
                  ))
                )}
              </AppCardContent>
            </AppCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Commerce And Entitlements</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="space-y-3 text-sm text-slate-700">
                <div className="flex justify-between"><span>Product revenue</span><span>{formatMoney(clinicData.commandCenter.commerce.productRevenue)}</span></div>
                <div className="flex justify-between"><span>Package revenue</span><span>{formatMoney(clinicData.commandCenter.commerce.packageRevenue)}</span></div>
                <div className="flex justify-between"><span>Membership revenue</span><span>{formatMoney(clinicData.commandCenter.commerce.membershipRevenue)}</span></div>
                <div className="flex justify-between"><span>Attach rate</span><span>{formatPercent(clinicData.commandCenter.commerce.attachRate)}</span></div>
                <div className="flex justify-between"><span>Active memberships</span><span>{clinicData.commandCenter.memberships.activeCount}</span></div>
                <div className="flex justify-between"><span>Membership churn</span><span>{formatPercent(clinicData.commandCenter.memberships.churnRate)}</span></div>
                <div className="flex justify-between"><span>Package utilization</span><span>{formatPercent(clinicData.commandCenter.packages.utilizationRate)}</span></div>
                <div className="flex justify-between"><span>Packages expiring soon</span><span>{clinicData.commandCenter.packages.expiringSoonCount}</span></div>
              </AppCardContent>
            </AppCard>

            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Patient Analytics</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="space-y-3 text-sm text-slate-700">
                <div className="flex justify-between"><span>Distinct patients</span><span>{clinicData.commandCenter.patients.distinctPatients}</span></div>
                <div className="flex justify-between"><span>Average visits per patient</span><span>{clinicData.commandCenter.patients.averageVisitsPerPatient.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Repeat visit rate</span><span>{formatPercent(clinicData.commandCenter.patients.repeatVisitRate)}</span></div>
                <div className="flex justify-between"><span>Inactive patients</span><span>{clinicData.commandCenter.patients.inactivePatients}</span></div>
                <div className="flex justify-between"><span>Drop-off risk</span><span>{clinicData.commandCenter.patients.dropOffRiskCount}</span></div>
                {clinicData.commandCenter.patients.topPatientsByValue.length > 0 && (
                  <div className="pt-3">
                    <div className="mb-2 font-medium text-slate-900">Top patients by value</div>
                    <div className="space-y-2">
                      {clinicData.commandCenter.patients.topPatientsByValue.map((patient) => (
                        <div key={patient.patientId} className="flex justify-between">
                          <span>{patient.patientName}</span>
                          <span>{formatMoney(patient.lifetimeValue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </AppCardContent>
            </AppCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Provider Utilization</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="space-y-3">
                {clinicData.commandCenter.providerUtilization.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No provider availability data configured.</div>
                ) : (
                  clinicData.commandCenter.providerUtilization.map((row) => (
                    <div key={row.provider.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {row.provider.firstName} {row.provider.lastName}
                        </div>
                        <div className="font-semibold">{formatPercent(row.utilizationRate)}</div>
                      </div>
                      <div className="mt-2 grid gap-2 text-sm text-slate-600 md:grid-cols-4">
                        <div>Scheduled: {row.scheduledMinutes.toFixed(0)} min</div>
                        <div>Available: {row.availableMinutes.toFixed(0)} min</div>
                        <div>Completed: {row.completedAppointments}</div>
                        <div>Cancel/No-show: {row.cancellationCount}/{row.noShowCount}</div>
                      </div>
                    </div>
                  ))
                )}
              </AppCardContent>
            </AppCard>

            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Commission Visibility</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="space-y-3 text-sm text-slate-700">
                <div className="flex justify-between"><span>Commission owed</span><span>{formatMoney(clinicData.commandCenter.commissions.owed)}</span></div>
                <div className="flex justify-between"><span>Commission paid</span><span>{formatMoney(clinicData.commandCenter.commissions.paid)}</span></div>
                <div className="flex justify-between"><span>Pending records</span><span>{clinicData.commandCenter.commissions.pendingCount}</span></div>
                <div className="flex justify-between"><span>Total records</span><span>{clinicData.commandCenter.commissions.totalCount}</span></div>
                {isAdmin && clinicData.commandCenter.topProviders.length > 0 && (
                  <div className="pt-3">
                    <div className="mb-2 font-medium text-slate-900">Top providers by collected revenue</div>
                    <div className="space-y-2">
                      {clinicData.commandCenter.topProviders.map((provider) => (
                        <div key={provider.providerId} className="flex justify-between">
                          <span>{provider.providerName}</span>
                          <span>{formatMoney(provider.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </AppCardContent>
            </AppCard>
          </div>
        </>
      )}

      {!isClinicMode && providerData && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Completed Appointments</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="text-3xl font-semibold">
                {providerData.performance.completedAppointments}
              </AppCardContent>
            </AppCard>
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Revenue Generated</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="text-3xl font-semibold">
                {formatMoney(providerData.performance.revenueGenerated)}
              </AppCardContent>
            </AppCard>
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Avg Revenue Per Visit</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="text-3xl font-semibold">
                {formatMoney(providerData.performance.averageRevenuePerVisit)}
              </AppCardContent>
            </AppCard>
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Utilization</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="text-3xl font-semibold">
                {formatPercent(providerData.performance.utilizationRate)}
              </AppCardContent>
            </AppCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Performance</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="space-y-3 text-sm text-slate-700">
                <div className="flex justify-between"><span>Total appointments</span><span>{providerData.performance.totalAppointments}</span></div>
                <div className="flex justify-between"><span>Cancellation count</span><span>{providerData.performance.cancellationCount}</span></div>
                <div className="flex justify-between"><span>No-show count</span><span>{providerData.performance.noShowCount}</span></div>
                <div className="flex justify-between"><span>Follow-up conversion</span><span>{formatPercent(providerData.performance.followUpConversionRate)}</span></div>
                <div className="flex justify-between"><span>Repeat patient rate</span><span>{formatPercent(providerData.performance.repeatPatientRate)}</span></div>
                <div className="flex justify-between"><span>Scheduled minutes</span><span>{providerData.performance.scheduledMinutes.toFixed(0)}</span></div>
                <div className="flex justify-between"><span>Available minutes</span><span>{providerData.performance.availableMinutes.toFixed(0)}</span></div>
              </AppCardContent>
            </AppCard>

            <AppCard>
              <AppCardHeader>
                <AppCardTitle>Commissions</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="space-y-3 text-sm text-slate-700">
                <div className="flex justify-between"><span>Owed</span><span>{formatMoney(providerData.commissions.owed)}</span></div>
                <div className="flex justify-between"><span>Paid</span><span>{formatMoney(providerData.commissions.paid)}</span></div>
                <div className="flex justify-between"><span>Pending records</span><span>{providerData.commissions.pendingCount}</span></div>
                <div className="flex justify-between"><span>Total records</span><span>{providerData.commissions.totalCount}</span></div>
              </AppCardContent>
            </AppCard>
          </div>

          <AppCard>
            <AppCardHeader>
              <AppCardTitle>Top Services In Your Period</AppCardTitle>
            </AppCardHeader>
            <AppCardContent className="space-y-3">
              {providerData.topServices.length === 0 ? (
                <div className="text-sm text-muted-foreground">No completed service revenue in this period.</div>
              ) : (
                providerData.topServices.map((service) => (
                  <div key={service.serviceId} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{service.serviceName}</div>
                      <div className="text-sm text-slate-600">{service.count} line items</div>
                    </div>
                    <div className="font-semibold">{formatMoney(service.revenue)}</div>
                  </div>
                ))
              )}
            </AppCardContent>
          </AppCard>
        </>
      )}
    </div>
  );
}
