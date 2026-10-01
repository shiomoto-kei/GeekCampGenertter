import { supabase } from "@/lib/supabase/client";

export type IconOption = {
  id: number;
  name: string;
  gender: string;
  generation: string;
  image_path: string;
};

export function iconImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  if (/^https:\/\//i.test(imagePath) || imagePath.startsWith("/")) return imagePath;
  return supabase.storage.from("icons").getPublicUrl(imagePath).data.publicUrl;
}
