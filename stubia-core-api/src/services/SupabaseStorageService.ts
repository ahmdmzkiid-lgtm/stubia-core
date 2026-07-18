import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || 'docs';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[SupabaseStorageService] Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

export class SupabaseStorageService {
  /**
   * Uploads a base64 encoded file to Supabase Storage and returns its public URL.
   * @param folderPath Path prefix (e.g. 'SOP', 'tasks', 'Legal')
   * @param filename Original filename
   * @param base64Data Base64-encoded file string
   * @param fileType MIME type of the file
   */
  static async uploadFile(
    folderPath: string,
    filename: string,
    base64Data: string,
    fileType: string
  ): Promise<string> {
    const base64Content = base64Data.split(';base64,').pop();
    if (!base64Content) {
      throw new Error('Format file base64 tidak valid');
    }

    const buffer = Buffer.from(base64Content, 'base64');
    
    // Generate safe, clean and unique filename
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const safeFilename = `${Date.now()}-${cleanFilename}`;
    const storagePath = `${folderPath}/${safeFilename}`;

    const { data, error } = await supabase.storage
      .from(supabaseBucket)
      .upload(storagePath, buffer, {
        contentType: fileType,
        upsert: true,
      });

    if (error) {
      console.error('[SupabaseStorageService] Upload Error:', error);
      throw new Error(`Gagal mengunggah berkas ke Supabase Storage: ${error.message}`);
    }

    // Get public CDN URL
    const { data: publicUrlData } = supabase.storage
      .from(supabaseBucket)
      .getPublicUrl(storagePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Gagal mendapatkan URL publik untuk berkas yang diunggah');
    }

    return publicUrlData.publicUrl;
  }

  /**
   * Deletes a file from Supabase Storage using its public URL
   * @param fileUrl Full public URL of the file
   */
  static async deleteFile(fileUrl: string): Promise<void> {
    try {
      const prefix = `${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/`;
      if (!fileUrl.startsWith(prefix)) {
        console.warn(`[SupabaseStorageService] URL does not match current bucket prefix, skipping deletion: ${fileUrl}`);
        return;
      }

      const storagePath = fileUrl.replace(prefix, '');
      const { error } = await supabase.storage
        .from(supabaseBucket)
        .remove([storagePath]);

      if (error) {
        console.error('[SupabaseStorageService] Delete Error:', error);
        throw new Error(`Gagal menghapus berkas dari Supabase Storage: ${error.message}`);
      }
    } catch (err: any) {
      console.error('[SupabaseStorageService] Unexpected error deleting file:', err);
      throw err;
    }
  }
}
