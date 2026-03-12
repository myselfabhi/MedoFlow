'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { addInvoiceItem, createInvoice, finalizeInvoice, recordManualInvoicePayment } from '@/lib/invoiceApi';
import { toast } from 'sonner';
import { Receipt, ShoppingCart, Trash2 } from 'lucide-react';

type CatalogType = 'SERVICE' | 'PRODUCT' | 'PACKAGE';

interface CatalogItem {
  id: string;
  name: string;
  description?: string;
  defaultPrice?: string;
  price?: string;
}

interface CartLine {
  id: string;
  itemType: CatalogType;
  name: string;
  quantity: number;
  unitPrice: number;
}

const MANUAL_PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CHECK', label: 'Check' },
  { value: 'CARD_PRESENT', label: 'Card (manual/offline)' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'OTHER', label: 'Other' },
];

export default function FrontDeskCheckoutPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [services, setServices] = useState<CatalogItem[]>([]);
  const [packages, setPackages] = useState<CatalogItem[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [collectPaymentNow, setCollectPaymentNow] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, productsRes, servicesRes, packagesRes] = await Promise.all([
          api.get('/patients'),
          api.get('/products'),
          api.get('/services'),
          api.get('/packages'),
        ]);
        setPatients(patientsRes.data.data.patients ?? []);
        setProducts(productsRes.data.data.products ?? []);
        setServices(servicesRes.data.data.services ?? []);
        setPackages(packagesRes.data.data.packages ?? []);
      } catch (error) {
        toast.error('Failed to load front-desk checkout data');
      }
    };
    fetchData();
  }, []);

  const addToCart = (item: CatalogItem, itemType: CatalogType) => {
    setCart((current) => {
      const existing = current.find((line) => line.id === item.id && line.itemType === itemType);
      const unitPrice = Number(item.price ?? item.defaultPrice ?? 0);
      if (existing) {
        return current.map((line) =>
          line === existing ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [
        ...current,
        {
          id: item.id,
          itemType,
          name: item.name,
          quantity: 1,
          unitPrice,
        },
      ];
    });
  };

  const removeLine = (index: number) => {
    setCart((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart]
  );

  const handleCheckout = async () => {
    if (!selectedPatientId) {
      toast.error('Select an existing patient');
      return;
    }
    if (cart.length === 0) {
      toast.error('Add at least one line item');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdInvoice = await createInvoice({
        patientId: selectedPatientId,
      });

      for (const line of cart) {
        await addInvoiceItem(createdInvoice.id, {
          itemType: line.itemType,
          itemId: line.id,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          description: line.name,
        });
      }

      const finalizedInvoice = await finalizeInvoice(createdInvoice.id);

      if (collectPaymentNow) {
        const amountToCollect =
          paymentAmount.trim().length > 0
            ? Number(paymentAmount)
            : Number(finalizedInvoice.totalAmount);

        await recordManualInvoicePayment(finalizedInvoice.id, {
          amount: amountToCollect,
          paymentMethod,
          notes: paymentNotes.trim() || undefined,
        });
      }

      toast.success(
        collectPaymentNow
          ? 'Invoice created and manual payment recorded'
          : 'Invoice created and left outstanding'
      );
      setCart([]);
      setSelectedPatientId('');
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Checkout failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-auto border-r border-border p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Front-Desk Checkout</h1>
          <p className="text-sm text-muted-foreground">
            This creates a real invoice and optionally records an offline/manual payment.
            New patient creation is not part of this screen.
          </p>
        </div>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Services</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {services.map((service) => (
              <Card
                key={`service-${service.id}`}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => addToCart(service, 'SERVICE')}
              >
                <CardContent className="p-4 text-center">
                  <div className="font-medium">{service.name}</div>
                  <div className="text-muted-foreground">
                    ${Number(service.defaultPrice ?? 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Products</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {products.map((product) => (
              <Card
                key={`product-${product.id}`}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => addToCart(product, 'PRODUCT')}
              >
                <CardContent className="p-4 text-center">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-muted-foreground">
                    ${Number(product.price ?? 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Packages</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {packages.map((pkg) => (
              <Card
                key={`package-${pkg.id}`}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => addToCart(pkg, 'PACKAGE')}
              >
                <CardContent className="p-4 text-center">
                  <div className="font-medium">{pkg.name}</div>
                  <div className="text-muted-foreground">
                    ${Number(pkg.price ?? 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <div className="flex w-[420px] flex-col bg-muted/30">
        <div className="border-b border-border p-6 space-y-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <ShoppingCart className="h-5 w-5" />
            Checkout
          </h2>
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger>
              <SelectValue placeholder="Select existing patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.name} ({patient.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              No items selected yet.
            </div>
          ) : (
            cart.map((line, index) => (
              <div
                key={`${line.itemType}-${line.id}-${index}`}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
              >
                <div>
                  <div className="font-medium">{line.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {line.quantity} x ${line.unitPrice.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-semibold">
                    ${(line.quantity * line.unitPrice).toFixed(2)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeLine(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border bg-background p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Catalog subtotal</span>
            <span className="text-2xl font-bold">${subtotal.toFixed(2)}</span>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={collectPaymentNow}
              onChange={(event) => setCollectPaymentNow(event.target.checked)}
            />
            Record manual payment now
          </label>

          {collectPaymentNow ? (
            <div className="space-y-3">
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  {MANUAL_PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                placeholder="Payment amount (leave blank for full total)"
                inputMode="decimal"
              />
              <Input
                value={paymentNotes}
                onChange={(event) => setPaymentNotes(event.target.value)}
                placeholder="Optional notes"
              />
            </div>
          ) : (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              The invoice will be created and finalized, then left outstanding for later collection.
            </div>
          )}

          <Button
            className="h-12 w-full text-lg"
            onClick={handleCheckout}
            disabled={isSubmitting || cart.length === 0}
          >
            <Receipt className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Processing...' : 'Create Real Checkout'}
          </Button>
        </div>
      </div>
    </div>
  );
}
