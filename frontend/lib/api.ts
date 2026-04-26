import axios from "axios";

// Use relative URL for client-side API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://100.73.184.77:8010";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types
export interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at: string;
}

export interface Product {
  id: string;
  group_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface ProductDetail extends Product {
  variants: Variant[];
  categories: Category[];
}

export interface Variant {
  id: string;
  product_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Category {
  id: string;
  product_id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at: string;
}

// API Functions
export const getHealth = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    return await res.json();
  } catch (e) {
    throw e;
  }
};

export const getProductGroups = async () => {
  const res = await fetch(`${API_BASE_URL}/product-groups/`);
  return await res.json();
};

export const createProductGroup = async (data: { name: string; description?: string }) => {
  const res = await fetch(`${API_BASE_URL}/product-groups/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const getProducts = async () => {
  const res = await fetch(`${API_BASE_URL}/products/`);
  return await res.json();
};

export const createProduct = async (data: { group_id: string; name: string; description?: string }) => {
  const res = await fetch(`${API_BASE_URL}/products/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const getProduct = async (id: string) => {
  const res = await fetch(`${API_BASE_URL}/products/${id}`);
  return await res.json();
};

export const createVariant = async (productId: string, data: { name: string; description?: string }) => {
  const res = await fetch(`${API_BASE_URL}/products/${productId}/variants/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const createCategory = async (productId: string, data: { name: string; description?: string }) => {
  const res = await fetch(`${API_BASE_URL}/products/${productId}/categories/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
};
