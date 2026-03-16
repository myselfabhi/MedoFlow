'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  itemId: string;
  itemType: 'PRODUCT' | 'PACKAGE' | 'MEMBERSHIP' | 'SERVICE';
  name: string;
  unitPrice: number;
  quantity: number;
  product?: any;
  package?: any;
  membership?: any;
  service?: any;
}

const LOCAL_CART_KEY = 'medoflow_guest_cart';

export function useCart() {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState<{ items: CartItem[] }>({ items: [] });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCartItems = useCallback(async () => {
    setIsLoading(true);
    if (isAuthenticated) {
      try {
        const res = await api.get('/carts');
        setCart(res.data.data.cart);
      } catch (err) {
        console.error('Failed to fetch server cart', err);
      }
    } else {
      const savedCart = localStorage.getItem(LOCAL_CART_KEY);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error('Failed to parse local cart', e);
        }
      }
    }
    setIsLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  // Sync guest cart to server when user logs in
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const savedCart = localStorage.getItem(LOCAL_CART_KEY);
      if (savedCart) {
        try {
          const { items } = JSON.parse(savedCart);
          if (items && items.length > 0) {
            const syncCart = async () => {
              for (const item of items) {
                try {
                  await api.post('/carts/items', {
                    itemType: item.itemType,
                    itemId: item.itemId,
                    quantity: item.quantity,
                  });
                } catch (e) {
                  console.error('Failed to sync item', item.name, e);
                }
              }
              localStorage.removeItem(LOCAL_CART_KEY);
              fetchCartItems();
              toast.success('Your guest cart has been synced to your account!');
            };
            syncCart();
          }
        } catch (e) {
          console.error('Failed to parse and sync guest cart', e);
        }
      }
    }
  }, [isAuthenticated, isLoading, fetchCartItems]);

  const addToCart = async (item: any, type: CartItem['itemType']) => {
    if (isAuthenticated) {
      try {
        await api.post('/carts/items', {
          itemType: type,
          itemId: item.id,
          quantity: 1,
        });
        toast.success(`Added ${item.name} to cart`);
        fetchCartItems();
      } catch (error) {
        console.error('Failed to add to server cart', error);
        toast.error('Could not add item to cart.');
      }
    } else {
      // Guest cart logic
      const currentCart = { ...cart };
      const existingItemIndex = currentCart.items.findIndex(
        (i) => i.itemId === item.id && i.itemType === type
      );

      if (existingItemIndex > -1) {
        currentCart.items[existingItemIndex].quantity += 1;
      } else {
        const newItem: CartItem = {
          id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          itemId: item.id,
          itemType: type,
          name: item.name,
          unitPrice: Number(item.price || item.monthlyPrice || 0),
          quantity: 1,
          product: type === 'PRODUCT' ? item : undefined,
          package: type === 'PACKAGE' ? item : undefined,
          membership: type === 'MEMBERSHIP' ? item : undefined,
        };
        currentCart.items.push(newItem);
      }

      setCart(currentCart);
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(currentCart));
      toast.success(`Added ${item.name} to guest cart`);
    }
  };

  const clearGuestCart = () => {
    localStorage.removeItem(LOCAL_CART_KEY);
    if (!isAuthenticated) {
      setCart({ items: [] });
    }
  };

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    totalItems,
    isLoading,
    addToCart,
    fetchCartItems,
    clearGuestCart,
    isAuthenticated
  };
}
