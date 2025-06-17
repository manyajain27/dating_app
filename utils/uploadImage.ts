import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import mime from 'mime';

// Helper to convert base64 string to Uint8Array (React Native friendly)
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryStr = atob(base64);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

export const uploadImageToSupabase = async (uri: string, userId: string) => {
  try {
    const fileExt = uri.split('.').pop() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;
    const contentType = mime.getType(uri) || 'image/jpeg';

    // Copy to cache (needed for some platforms)
    await FileSystem.copyAsync({ from: uri, to: filePath });

    // Read as base64
    const fileBase64 = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileBytes = base64ToUint8Array(fileBase64);

    // Upload using Supabase Storage
    const { error } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, fileBytes, {
        contentType,
        upsert: true,
      });

    if (error) throw error;

    // Return public URL
    const { data } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    return null;
  }
};
