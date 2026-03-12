'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { Plus } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.data.products);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Products Catalog</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {product.description || 'No description available.'}
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">${Number(product.price).toFixed(2)}</span>
                  <span className="text-sm">
                    Stock: {product.inventoryItem?.quantityInStock || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-10">
              No products found. Add one to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
