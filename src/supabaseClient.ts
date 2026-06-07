import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Oyuncunun arka planda anonim olarak oturum açmasını sağlayan fonksiyon
export const initializeUser = async () => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error("Oturum kontrol edilirken hata oluştu:", sessionError.message);
    return null;
  }

  // Eğer mevcut bir oturum yoksa, yeni bir anonim oturum başlat
  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("Anonim giriş başarısız oldu:", error.message);
      return null;
    }
    return data.user;
  }

  return session.user;
};