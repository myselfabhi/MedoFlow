'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from '@/components/StripePaymentForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

export default function CheckoutPage() {
  const [cart, setCart] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await api.get('/carts');
        setCart(res.data.data.cart);
      } catch (err) {
        console.error('Failed to fetch cart', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCart();
  }, []);

  const handleInitiateCheckout = async () => {
    try {
      const res = await api.post('/carts/checkout');
      setClientSecret(res.data.data.clientSecret);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate checkout');
    }
  };

  if (isLoading) return <div className="p-12 text-center">Loading checkout...</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto py-12 text-center space-y-6">
        <h1 className="text-3xl font-bold">Your cart is empty</h1>
        <Button onClick={() => router.push('/store')}>Go to Store</Button>
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum: number, item: any) => sum + (Number(item.unitPrice) * item.quantity), 0);

  return (
    <div className="container mx-auto py-12 max-w-3xl">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Checkout</h1>
      
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                <div>
                  <div className="font-medium">
                    {item.itemType === 'PRODUCT' ? item.product?.name : 
                     item.itemType === 'PACKAGE' ? item.package?.name : 
                     item.itemType === 'SERVICE' ? item.service?.name : 'Item'}
                  </div>
                  <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                </div>
                <div className="font-semibold">
                  ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="bg-muted/50 border-t flex justify-between items-center p-6">
            <span className="text-xl font-bold">Total</span>
            <span className="text-3xl font-bold">${subtotal.toFixed(2)}</span>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            {!clientSecret ? (
              <Button 
                className="w-full h-14 text-lg" 
                onClick={handleInitiateCheckout}
              >
                Continue to Payment
              </Button>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentForm 
                  clientSecret={clientSecret} 
                  buttonLabel={`Pay $${subtotal.toFixed(2)}`}
                  onSuccess={() => router.push('/dashboard/patient/appointments')}
                />
              </Elements>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
