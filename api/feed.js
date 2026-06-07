import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Sadece POST (veri gönderme) isteklerini kabul et
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST metoduna izin verilir' });
  }

  const { choice, captchaToken, userId } = req.body;

  // 1. İNSAN MI KONTROLÜ (Cloudflare'e soruyoruz)
  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${process.env.CLOUDFLARE_SECRET_KEY}&response=${captchaToken}`
  });
  
  const verifyData = await verifyRes.json();
  
  // Eğer bot ise, işlemi burada iptal et!
  if (!verifyData.success) {
    return res.status(400).json({ error: 'Bot saldırısı tespit edildi!' });
  }

  // 2. İNSANSA SUPABASE'E TAM YETKİ İLE BAĞLAN
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY // Bu anahtar tüm yetkilere sahiptir
  );

  // 3. ADIM 2'DE YAZDIĞIMIZ GÜVENLİ SQL FONKSİYONUNU ÇALIŞTIR
  const { data, error } = await supabase.rpc('feed_character_secure', {
    choice_param: choice,
    user_id_param: userId
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  return res.status(200).json(data);
}