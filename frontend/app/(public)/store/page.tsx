'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function StorefrontPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, packRes] = await Promise.all([
          api.get('/products'),
          api.get('/packages'),
        ]);
        setProducts(prodRes.data.data.products);
        setPackages(packRes.data.data.packages);
      } catch (err) {
        console.error('Failed to fetch catalog', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = async (item: any, type: string) => {
    try {
      await api.post('/carts/items', {
        itemType: type,
        itemId: item.id,
        quantity: 1,
      });
      // In a real app, this would trigger a cart refresh or open a cart drawer
      alert('Added to cart!');
    } catch (error) {
      console.error('Failed to add to cart', error);
      alert('Failed to add to cart. Please log in.');
    }
  };

  return (
    <div className="container mx-auto py-12 space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Clinic Store</h1>
          <p className="text-muted-foreground mt-2 text-lg">Purchase products and wellness packages directly.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/checkout">
            <ShoppingCart className="mr-2 h-4 w-4" /> Go to Checkout
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20">Loading catalog...</div>
      ) : (
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold mb-6">Featured Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(p => (
                <Card key={p.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                    <div className="mt-4 text-xl font-bold">${Number(p.price).toFixed(2)}</div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={() => addToCart(p, 'PRODUCT')}>
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-6">Wellness Packages</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {packages.map(pkg => (
                <Card key={pkg.id} className="flex flex-col border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle>{pkg.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">{pkg.description}</p>
                    <div className="mt-2 text-sm font-medium">{pkg.totalSessions} Sessions</div>
                    <div className="mt-4 text-xl font-bold">${Number(pkg.price).toFixed(2)}</div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="secondary" onClick={() => addToCart(pkg, 'PACKAGE')}>
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
