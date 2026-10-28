import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { productService } from "@/services/product-service";
import { CreateProductInput, GetProductsParams, UpdateProductInput } from "@/types/product";

export function useProducts(
  domainId: string,
  options?: GetProductsParams | string
) {
  const queryClient = useQueryClient();

  const search = typeof options === "string" ? options : options?.search;
  const page = typeof options === "object" ? options?.page : undefined;
  const pageSize = typeof options === "object" ? options?.page_size : undefined;

  const queryKey = [
    "domains",
    domainId,
    "products",
    { search: search?.trim() || "", page: page || 1, pageSize: pageSize || 10 },
  ];

  // 1. Fetch products
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () =>
      productService.getProducts(domainId, {
        search,
        page,
        page_size: pageSize,
      }),
    enabled: Boolean(domainId),
  });

  const products = data?.products || [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;
  const currentPage = data?.page ?? 1;
  const currentPageSize = data?.page_size ?? 10;


  // 2. Create product
  const createProductMutation = useMutation({
    mutationFn: (payload: CreateProductInput) =>
      productService.createProduct(domainId, payload),
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["domains", domainId] });
      toast.success("Thêm sản phẩm thành công", {
        description: `Sản phẩm "${newProduct.name}" đã sẵn sàng cho ChatBot tư vấn và RAG.`,
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error("Không thể thêm sản phẩm", {
        description: err.response?.data?.detail || "Đã xảy ra lỗi vui lòng thử lại.",
      });
    },
  });

  // 3. Update product
  const updateProductMutation = useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: UpdateProductInput;
    }) => productService.updateProduct(domainId, productId, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["domains", domainId] });
      toast.success("Cập nhật sản phẩm thành công", {
        description: `Sản phẩm "${updated.name}" đã được lưu thay đổi.`,
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error("Không thể cập nhật sản phẩm", {
        description: err.response?.data?.detail || "Đã xảy ra lỗi vui lòng thử lại.",
      });
    },
  });

  // 4. Delete product
  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) =>
      productService.deleteProduct(domainId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["domains", domainId] });
      toast.success("Đã xóa sản phẩm", {
        description: "Sản phẩm đã được gỡ bỏ khỏi kho và cơ sở tri thức của Bot.",
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error("Không thể xóa sản phẩm", {
        description: err.response?.data?.detail || "Đã xảy ra lỗi vui lòng thử lại.",
      });
    },
  });

  return {
    products,
    total,
    totalPages,
    page: currentPage,
    pageSize: currentPageSize,
    isLoading,
    isError,
    refetch,
    createProduct: createProductMutation.mutateAsync,
    isCreating: createProductMutation.isPending,
    updateProduct: updateProductMutation.mutateAsync,
    isUpdating: updateProductMutation.isPending,
    deleteProduct: deleteProductMutation.mutateAsync,
    isDeleting: deleteProductMutation.isPending,
  };
}
