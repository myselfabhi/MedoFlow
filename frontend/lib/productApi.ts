import api from './api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  price: string | number;
  inventoryItem?: {
    quantityInStock: number;
  };
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  sku?: string;
  price: number;
}

export const getProducts = async () => {
  const res = await api.get('/products');
  return res.data.data.products as Product[];
};

export const createProduct = async (payload: CreateProductPayload) => {
  const res = await api.post('/products', payload);
  return res.data.data.product as Product;
};

export const updateProduct = async (id: string, payload: Partial<CreateProductPayload>) => {
  const res = await api.put(`/products/${id}`, payload);
  return res.data.data.product as Product;
};

export const deleteProduct = async (id: string) => {
  await api.delete(`/products/${id}`);
};
