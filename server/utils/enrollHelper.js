import supabase from "../config/supabaseClient.js";

export function safeJsonParse(value, fallback = {}) {
  try {
    if (!value) return fallback;
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}

export async function uploadImage(file, folder, defaultFile) {
  if (!file) {
    return {
      url: supabase.storage
        .from("images")
        .getPublicUrl(`${folder}/${defaultFile}`)
        .data.publicUrl,
      path: null
    };
  }

  const path = `${folder}/${Date.now()}-${file.originalname}`;

  const { error } = await supabase.storage
    .from("images")
    .upload(path, file.buffer, {
      contentType: file.mimetype
    });

  if (error) throw error;

  const url = supabase.storage
    .from("images")
    .getPublicUrl(path).data.publicUrl;

  return { url, path };
}