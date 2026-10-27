"use client";

import * as React from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit2Icon,
  Loader2Icon,
  PackageIcon,
  PlusIcon,
  TagIcon,
  Trash2Icon,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProducts } from "@/hooks/settings/use-products";
import { productSchema, ProductFormValues } from "@/schemas/product";
import { Product } from "@/types/product";
import { ImageUploader } from "@/components/ui/image-uploader";
import uploadService from "@/services/upload-service";

interface ProductCatalogProps {
  domainId: string;
}

const PRESET_IMAGES = [
  {
    label: "Công nghệ",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80",
  },
  {
    label: "Đồng hồ",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80",
  },
  {
    label: "Túi xách",
    url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop&q=80",
  },
  {
    label: "Khóa học / Dịch vụ",
    url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop&q=80",
  },
];

export function ProductCatalog({ domainId }: ProductCatalogProps) {
  const {
    products,
    isLoading,
    createProduct,
    isCreating,
    updateProduct,
    isUpdating,
    deleteProduct,
    isDeleting,
  } = useProducts(domainId);

  // Dialog state
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = React.useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: 0,
      image: "",
    },
  });

  const watchedPrice = watch("price");
  const watchedImage = watch("image");

  const formattedPrice = React.useMemo(() => {
    const p = Number(watchedPrice);
    if (isNaN(p) || p <= 0) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(p);
  }, [watchedPrice]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setSelectedImageFile(null);
    reset({
      name: "",
      price: 100000,
      image: PRESET_IMAGES[0].url,
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setSelectedImageFile(null);
    reset({
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setIsOpen(true);
  };

  const onSubmit = async (values: ProductFormValues) => {
    try {
      let finalImageUrl = values.image;

      // Only upload to Cloudinary upon saving if a new file was chosen
      if (selectedImageFile) {
        setIsUploadingImage(true);
        const res = await uploadService.uploadImage(selectedImageFile);
        finalImageUrl = res.url;
      }

      const payload = {
        ...values,
        image: finalImageUrl,
      };

      if (editingProduct) {
        await updateProduct({
          productId: editingProduct.id,
          payload,
        });
      } else {
        await createProduct(payload);
      }
      setSelectedImageFile(null);
      setIsOpen(false);
      reset();
    } catch {
      // Error handled by mutation hook toast
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      setDeleteConfirmId(null);
    } catch {
      // Error handled by mutation hook toast
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              Sản phẩm & Dịch vụ của Website
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              {products.length} sản phẩm
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Các mặt hàng hoặc dịch vụ mà ChatBot AI sẽ sử dụng để tư vấn giá và gửi liên kết thanh toán VietQR.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
        >
          <PlusIcon className="size-4 mr-1.5" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
          <Loader2Icon className="size-5 animate-spin text-primary" />
          <span className="text-sm">Đang tải danh sách sản phẩm...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && products.length === 0 && (
        <Card className="border border-dashed border-border/80 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center px-4">
            <div className="size-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-4">
              <PackageIcon className="size-6 stroke-[1.5]" />
            </div>
            <h4 className="text-base font-medium text-foreground">
              Chưa có sản phẩm nào trong kho
            </h4>
            <p className="text-sm text-muted-foreground max-w-sm mt-1.5 mb-5">
              Thêm sản phẩm hoặc gói dịch vụ để trợ lý AI tự động nắm bắt bảng giá, thông số và hỗ trợ khách hàng chốt đơn tự động.
            </p>
            <Button onClick={handleOpenAdd} variant="outline" className="gap-2">
              <PlusIcon className="size-4" />
              Tạo sản phẩm đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Product Grid */}
      {!isLoading && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const formattedItemPrice = new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(product.price);

            return (
              <Card
                key={product.id}
                className="group overflow-hidden rounded-xl border border-border/60 bg-card hover:border-border transition-all duration-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Image container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-muted/40 border-b border-border/40">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="size-8 stroke-1" />
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-1.5">
                    <h4 className="font-medium text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h4>
                    <div className="flex items-center text-primary font-semibold text-base">
                      <TagIcon className="size-3.5 mr-1.5 opacity-80" />
                      {formattedItemPrice}
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="px-4 py-2.5 bg-muted/20 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    ID: {product.id.slice(0, 8)}...
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(product)}
                      className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Chỉnh sửa sản phẩm"
                    >
                      <Edit2Icon className="size-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirmId(product.id)}
                      className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Xóa sản phẩm"
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </DialogTitle>
            <DialogDescription>
              Cung cấp thông tin tên, đơn giá và hình ảnh đại diện cho sản phẩm của bạn.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Tên sản phẩm */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">
                Tên sản phẩm / Gói dịch vụ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="VD: Khóa học Python Pro, Tai nghe Bluetooth..."
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Giá bán */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="price" className="text-xs font-medium">
                  Giá bán (VND) <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs font-semibold text-primary">
                  {formattedPrice}
                </span>
              </div>
              <Input
                id="price"
                type="number"
                step="1000"
                min="0"
                placeholder="VD: 500000"
                {...register("price")}
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>

            {/* URL & Upload Hình ảnh */}
            <div className="space-y-1.5">
              <ImageUploader
                value={watchedImage}
                onChange={(url) => setValue("image", url, { shouldValidate: true })}
                onFileSelect={setSelectedImageFile}
                isSaving={isUploadingImage || isCreating || isUpdating}
                label="Hình ảnh sản phẩm / dịch vụ"
                description="Xem trước tức thì và tải lên Cloudinary khi Lưu"
                aspectRatio="video"
                previewHeight="h-32"
                presets={PRESET_IMAGES}
                placeholder="https://cuahang.vn/product.jpg"
              />
              {errors.image && (
                <p className="text-xs text-destructive">{errors.image.message}</p>
              )}
            </div>

            <DialogFooter className="mt-6 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isCreating || isUpdating || isUploadingImage}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isUpdating || isUploadingImage}
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-24"
              >
                {(isCreating || isUpdating || isUploadingImage) ? (
                  <Loader2Icon className="size-4 animate-spin mr-1.5" />
                ) : null}
                {isUploadingImage
                  ? "Đang tải ảnh lên Cloudinary..."
                  : editingProduct
                  ? "Lưu thay đổi"
                  : "Thêm vào kho"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteConfirmId)}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa sản phẩm</DialogTitle>
            <DialogDescription>
              Hành động này sẽ xóa vĩnh viễn sản phẩm khỏi kho và gỡ bỏ dữ liệu khỏi bộ tri thức của ChatBot.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2Icon className="size-4 animate-spin mr-1.5" />
              ) : null}
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
