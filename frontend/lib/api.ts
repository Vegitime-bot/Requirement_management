import axios from "axios";

// Use relative URL to leverage Next.js proxy (configured in next.config.js)
const API_BASE_URL = "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
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
  code: string;
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
  code: string;
  description?: string;
  created_at: string;
}

export interface Category {
  id: string;
  product_id: string;
  name: string;
  code: string;
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

export const createProduct = async (data: { group_id: string; name: string; code: string; description?: string }) => {
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

export const createVariant = async (productId: string, data: { name: string; code: string; description?: string }) => {
  const res = await fetch(`${API_BASE_URL}/products/${productId}/variants/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const createCategory = async (productId: string, data: { name: string; code: string; description?: string }) => {
  const res = await fetch(`${API_BASE_URL}/products/${productId}/categories/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const getRequirements = async (productId: string) => {
  const res = await fetch(`${API_BASE_URL}/products/${productId}/requirements/`);
  return await res.json();
};

export const createRequirement = async (productId: string, data: {
  title: string;
  description?: string;
  category_id?: string;
  variant_id?: string;
  priority?: string;
}) => {
  const res = await fetch(`${API_BASE_URL}/products/${productId}/requirements/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const analyzeContext = async (data: {
  product_id: string;
  context_text: string;
  source_type?: string;
}) => {
  const res = await fetch(`${API_BASE_URL}/ingest/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const applyIngest = async (data: {
  product_id: string;
  extracted_requirements: any[];
  actions: any[];
}) => {
  const res = await fetch(`${API_BASE_URL}/ingest/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
};
