import api from './api';

export interface MembershipCatalogItem {
  id: string;
  name: string;
  description?: string | null;
  monthlyPrice: string;
  billingPeriod: string;
  serviceDiscountPercent: string;
  isActive: boolean;
}

export interface PatientSubscriptionRecord {
  id: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  membership: MembershipCatalogItem;
}

export const getMemberships = async (): Promise<MembershipCatalogItem[]> => {
  const { data } = await api.get<{
    success: boolean;
    data: { memberships: MembershipCatalogItem[] };
  }>('/memberships');
  return data.data.memberships;
};

export const getMyMembershipSubscriptions = async (): Promise<PatientSubscriptionRecord[]> => {
  const { data } = await api.get<{
    success: boolean;
    data: { subscriptions: PatientSubscriptionRecord[] };
  }>('/memberships/subscriptions/me');
  return data.data.subscriptions;
};

export const purchaseMembership = async (membershipId: string) => {
  const { data } = await api.post<{
    success: boolean;
    data: {
      clientSecret: string | null;
      reused: boolean;
      subscription: PatientSubscriptionRecord | null;
    };
  }>(`/memberships/${membershipId}/purchase`);
  return data.data;
};

export const cancelMembershipAtPeriodEnd = async (subscriptionId: string) => {
  const { data } = await api.post<{
    success: boolean;
    data: { subscription: PatientSubscriptionRecord };
  }>(`/memberships/subscriptions/${subscriptionId}/cancel`);
  return data.data.subscription;
};
