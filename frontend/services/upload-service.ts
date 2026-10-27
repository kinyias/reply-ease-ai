import apiClient from "@/lib/api-client";
import { ImageUploadResponse } from "@/types/upload";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
  "image/gif",
];

export const uploadService = {
  /**
   * Upload an image file to the backend (Cloudinary or local static storage).
   */
  async uploadImage(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<ImageUploadResponse> {
    // 1. Client-side validation for instant UX feedback
    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      throw new Error(
        `Định dạng file '${file.type || "không xác định"}' không được hỗ trợ. Vui lòng chọn ảnh PNG, JPG, JPEG, WEBP hoặc GIF.`
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(
        `Kích thước file (${sizeMB}MB) vượt quá giới hạn cho phép tối đa 2MB.`
      );
    }

    // 2. Prepare multipart form data
    const formData = new FormData();
    formData.append("file", file);

    // 3. Make HTTP POST request with upload progress tracking
    const response = await apiClient.post<ImageUploadResponse>(
      "/uploads/image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress?.(Math.min(percent, 99)); // keep at 99% until response completes
          }
        },
      }
    );

    onProgress?.(100);
    return response.data;
  },
};

export default uploadService;
