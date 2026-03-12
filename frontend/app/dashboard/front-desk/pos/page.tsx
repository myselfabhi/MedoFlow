'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ShoppingCart, Plus, Trash2 } from 'lucide-react';

export default function PointOfSalePage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  
  const [cart, setCart] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Fetch available catalog items
    api.get('/patients').then(res => setPatients(res.data.data.patients)).catch(console.error);
    api.get('/products').then(res => setProducts(res.data.data.products)).catch(console.error);
    api.get('/services').then(res => setServices(res.data.data.services)).catch(console.error);
    api.get('/packages').then(res => setPackages(res.data.data.packages)).catch(console.error);
  }, []);

  const addToCart = (item: any, type: string) => {
    const existing = cart.find(i => i.id === item.id && i.type === type);
    if (existing) {
      setCart(cart.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, type, quantity: 1, price: item.price || item.defaultPrice }]);
    }
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  
  const processCheckout = async () => {
    if (!selectedPatientId) {
      toast.error('Please select a patient first');
      return;
    }
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsProcessing(true);
    try {
      // In a real app, this would create an invoice via a backend endpoint 
      // specifically meant for front-desk walk-in billing.
      // E.g., POST /invoices/walk-in
      
      const payload = {
        patientId: selectedPatientId,
        items: cart.map(i => ({
          itemId: i.id,
          itemType: i.type,
          quantity: i.quantity,
          unitPrice: i.price
        }))
      };

      // Simulating a successful request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Transaction completed successfully');
      setCart([]);
      setSelectedPatientId('');
    } catch (error) {
      toast.error('Failed to process transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left side: Catalog */}
      <div className="flex-1 overflow-auto p-6 border-r border-border space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Point of Sale</h1>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(p => (
              <Card key={p.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => addToCart(p, 'PRODUCT')}>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-muted-foreground">${Number(p.price).toFixed(2)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Services</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(s => (
              <Card key={s.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => addToCart(s, 'SERVICE')}>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-muted-foreground">${Number(s.defaultPrice).toFixed(2)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right side: Cart */}
      <div className="w-[400px] flex flex-col bg-muted/30">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <ShoppingCart className="h-5 w-5" /> Current Cart
          </h2>
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name} ({p.email})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          {cart.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex justify-between items-center bg-background p-3 rounded-lg border border-border">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">
                  {item.quantity} x ${Number(item.price).toFixed(2)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-semibold">${(item.quantity * Number(item.price)).toFixed(2)}</div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              Cart is empty. Click items on the left to add them.
            </div>
          )}
        </div>

        <div className="p-6 bg-background border-t border-border mt-auto">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-medium">Total</span>
            <span className="text-2xl font-bold">${subtotal.toFixed(2)}</span>
          </div>
          <Button 
            className="w-full h-12 text-lg" 
            onClick={processCheckout} 
            disabled={isProcessing || cart.length === 0}
          >
            {isProcessing ? 'Processing...' : 'Complete Checkout'}
          </Button>
        </div>
      </div>
    </div>
  );
}
