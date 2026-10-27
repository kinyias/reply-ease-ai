import apiClient from "@/lib/api-client";
import { CreateProductInput, Product, UpdateProductInput } from "@/types/product";

export const productService = {
  /**
   * Retrieve all products belonging to a domain, with optional search term.
   */
  async getProducts(domainId: string, search?: string): Promise<Product[]> {
    const params: Record<string, string> = {};
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await apiClient.get<Product[]>(
      `/domains/${domainId}/products`,
      { params: Object.keys(params).length > 0 ? params : undefined }
    );
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
