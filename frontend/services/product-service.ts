import apiClient from "@/lib/api-client";
import {
  CreateProductInput,
  GetProductsParams,
  Product,
  ProductListResponse,
  UpdateProductInput,
} from "@/types/product";

export const productService = {
  /**
   * Retrieve products belonging to a domain, with optional search and pagination.
   */
  async getProducts(
    domainId: string,
    params?: GetProductsParams | string
  ): Promise<ProductListResponse> {
    const queryParams: Record<string, string | number> = {};

    if (typeof params === "string") {
      if (params.trim()) queryParams.search = params.trim();
    } else if (params) {
      if (params.search && params.search.trim()) {
        queryParams.search = params.search.trim();
      }
      if (params.page !== undefined) {
        queryParams.page = params.page;
      }
      if (params.page_size !== undefined) {
        queryParams.page_size = params.page_size;
      }
    }

    const response = await apiClient.get<ProductListResponse | Product[]>(
      `/domains/${domainId}/products`,
      { params: Object.keys(queryParams).length > 0 ? queryParams : undefined }
    );

    // Normalize response if server returned raw array
    if (Array.isArray(response.data)) {
      return {
        products: response.data,
        total: response.data.length,
        page: 1,
        page_size: response.data.length,
        total_pages: 1,
      };
    }

    return response.data;
  },


  /**
   * Create a new product for a domain.
   */
  async createProduct(
    domainId: string,
    payload: CreateProductInput
  ): Promise<Product> {
    const response = await apiClient.post<Product>(
      `/domains/${domainId}/products`,
      payload
    );
    return response.data;
  },

  /**
   * Update an existing product.
   */
  async updateProduct(
    domainId: string,
    productId: string,
    payload: UpdateProductInput
  ): Promise<Product> {
    const response = await apiClient.put<Product>(
      `/domains/${domainId}/products/${productId}`,
      payload
    );
    return response.data;
  },

  /**
   * Delete a product from a domain.
   */
  async deleteProduct(
    domainId: string,
    productId: string
  ): Promise<{ status: string; message: string; product_id: string }> {
    const response = await apiClient.delete<{
      status: string;
      message: string;
      product_id: string;
    }>(`/domains/${domainId}/products/${productId}`);
    return response.data;
  },
};
