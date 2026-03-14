'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  AppCard, 
  AppCardContent, 
  AppCardHeader, 
  AppCardTitle, 
  AppCardFooter,
  AppButton,
  AppPageHeader
} from '@/components/ui-system';
import { getClinics, getPublicClinicProducts, getPublicClinicPackages, getPublicClinicMemberships } from '@/lib/clinicApi';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, Package, Tags, ShoppingBag, CheckCircle2, Star, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

function StorefrontPageContent() {
  const { user, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') || 'products';
  
  const [products, setProducts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clinics = await getClinics();
        const mainClinic = clinics?.[0];
        if (!mainClinic) {
          setIsLoading(false);
          return;
        }

        const [prodRes, packRes, memRes] = await Promise.all([
          getPublicClinicProducts(mainClinic.id),
          getPublicClinicPackages(mainClinic.id),
          getPublicClinicMemberships(mainClinic.id),
        ]);
        setProducts(prodRes);
        setPackages(packRes);
        setMemberships(memRes);
      } catch (err) {
        console.error('Failed to fetch catalog', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = async (item: any, type: string) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to your cart');
      router.push('/login?returnUrl=/store');
      return;
    }

    try {
      await api.post('/carts/items', {
        itemType: type,
        itemId: item.id,
        quantity: 1,
      });
      toast.success(`Added ${item.name} to cart`);
    } catch (error) {
      console.error('Failed to add to cart', error);
      toast.error('Could not add item to cart. Please try again.');
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          {isAuthenticated && (
            <div className="flex items-center gap-2 text-primary-600 font-bold text-sm uppercase tracking-widest mb-2">
              <User className="h-4 w-4" /> Welcome back, {user?.name.split(' ')[0]}
            </div>
          )}
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Clinic Store</h1>
          <p className="text-lg text-slate-500 max-w-2xl">
            Curated health products and wellness plans designed to support your clinical journey.
          </p>
        </div>
        <AppButton asChild variant="outline" className="rounded-full h-12 px-6 border-slate-200">
          <Link href="/checkout">
            <ShoppingCart className="mr-2 h-5 w-5" /> View Cart
          </Link>
        </AppButton>
      </div>

      <Tabs value={tab} onValueChange={(v) => router.push(`/store?tab=${v}`)} className="space-y-8">
        <TabsList className="grid w-full grid-cols-3 max-w-md h-12 p-1 bg-slate-100 rounded-full">
          <TabsTrigger value="products" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ShoppingBag className="mr-2 h-4 w-4" /> Products
          </TabsTrigger>
          <TabsTrigger value="memberships" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Tags className="mr-2 h-4 w-4" /> Memberships
          </TabsTrigger>
          <TabsTrigger value="packages" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Package className="mr-2 h-4 w-4" /> Packages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(p => (
                <AppCard key={p.id} className="flex flex-col border-slate-100 hover:shadow-xl transition-all duration-300 rounded-2xl group">
                  <AppCardContent className="flex-1 p-6">
                    <div className="aspect-square bg-slate-50 rounded-xl mb-6 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <ShoppingBag className="h-12 w-12 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{p.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">{p.description || 'Professional grade supplement.'}</p>
                    <div className="text-2xl font-black text-slate-900">${Number(p.price).toFixed(2)}</div>
                  </AppCardContent>
                  <AppCardFooter className="p-6 pt-0 border-none">
                    <AppButton className="w-full rounded-full h-11" onClick={() => addToCart(p, 'PRODUCT')}>
                      Add to Cart
                    </AppButton>
                  </AppCardFooter>
                </AppCard>
              ))}
              {products.length === 0 && (
                <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No products available at this time.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="memberships" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isLoading ? (
              [1,2,3].map(i => <div key={i} className="h-96 bg-slate-100 animate-pulse rounded-2xl" />)
            ) : (
              memberships.map(m => (
                <AppCard key={m.id} className="flex flex-col border-2 border-slate-100 hover:border-primary-200 transition-colors rounded-3xl relative overflow-hidden">
                  {m.monthlyPrice > 100 && (
                    <div className="absolute top-0 right-0 bg-primary-600 text-white px-4 py-1 text-xs font-bold rounded-bl-xl uppercase tracking-widest">
                      Best Value
                    </div>
                  )}
                  <AppCardHeader className="p-8 border-none bg-slate-50/50">
                    <AppCardTitle className="text-2xl font-bold text-slate-900">{m.name}</AppCardTitle>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-4xl font-black text-slate-900">${Number(m.monthlyPrice).toFixed(0)}</span>
                      <span className="text-slate-500 ml-1">/ {m.billingPeriod.toLowerCase()}</span>
                    </div>
                  </AppCardHeader>
                  <AppCardContent className="flex-1 p-8 space-y-6">
                    <p className="text-slate-600">{m.description || 'Comprehensive care plan.'}</p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Priority Booking
                      </li>
                      <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Exclusive Discounts
                      </li>
                      <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Dedicated Support
                      </li>
                    </ul>
                  </AppCardContent>
                  <AppCardFooter className="p-8 pt-0 border-none">
                    <AppButton className="w-full rounded-full h-12 text-base font-bold" onClick={() => addToCart(m, 'MEMBERSHIP')}>
                      Choose Plan
                    </AppButton>
                  </AppCardFooter>
                </AppCard>
              ))
            )}
            {!isLoading && memberships.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Tags className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Membership plans coming soon.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="packages" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading ? (
              [1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl" />)
            ) : (
              packages.map(pkg => (
                <AppCard key={pkg.id} className="flex flex-col border-primary-100 bg-primary-50/10 hover:bg-primary-50/30 transition-colors rounded-2xl">
                  <AppCardContent className="flex-1 p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        <Package className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-bold">
                        {pkg.totalSessions} SESSIONS
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
                    <p className="text-sm text-slate-600 mb-6">{pkg.description}</p>
                    <div className="mt-auto pt-4 border-t border-primary-100 flex items-center justify-between">
                      <div className="text-2xl font-black text-slate-900">${Number(pkg.price).toFixed(2)}</div>
                      <AppButton size="sm" className="rounded-full px-6" onClick={() => addToCart(pkg, 'PACKAGE')}>
                        Buy Package
                      </AppButton>
                    </div>
                  </AppCardContent>
                </AppCard>
              ))
            )}
            {!isLoading && packages.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Wellness packages coming soon.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Trust Band */}
      <div className="bg-slate-900 rounded-[3rem] p-12 lg:p-20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-600/10 -skew-x-12 transform translate-x-1/4" />
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex gap-1 text-amber-400">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-current" />)}
            </div>
            <h2 className="text-3xl font-bold leading-tight">Expertly curated by our medical board.</h2>
            <p className="text-slate-400 text-lg">
              Every product in our store is vetted for purity, potency, and clinical efficacy by our practicing physicians.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
              <ShieldCheck className="h-8 w-8 text-primary-400 mb-4" />
              <h4 className="font-bold mb-1">Quality Guaranteed</h4>
              <p className="text-xs text-slate-400">Lab tested ingredients only.</p>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
              <ShoppingCart className="h-8 w-8 text-primary-400 mb-4" />
              <h4 className="font-bold mb-1">Fast Shipping</h4>
              <p className="text-xs text-slate-400">Direct to your doorstep.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StorefrontPage() {
  return (
    <React.Suspense fallback={null}>
      <StorefrontPageContent />
    </React.Suspense>
  );
}
