export interface ImageUploadResponse {
  url: string;
  id: string;
  provider: "cloudinary" | "local";
  filename?: string | null;
  format?: string | null;
  bytes?: number | null;
  width?: number | null;
  height?: number | null;
  created_at?: string | null;
}
