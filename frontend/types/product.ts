export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  domain_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductInput {
  name: string;
  price: number;
  image: string;
}

export interface UpdateProductInput {
  name?: string;
  price?: number;
  image?: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface GetProductsParams {
  search?: string;
  page?: number;
  page_size?: number;
}
