import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only the POST method is allowed.' });
  }

  const { choice, captchaToken, token } = req.body; // userId yerine token aldık

  // 1. İNSAN MI KONTROLÜ (Cloudflare Turnstile)
  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${process.env.CLOUDFLARE_SECRET_KEY}&response=${captchaToken}`
  });
  
  const verifyData = await verifyRes.json();
  if (!verifyData.success) {
    return res.status(400).json({ error: 'Bot attack detected!' });
  }

  // 2. SUPABASE'E BAĞLAN
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 3. KRİTİK ADIM: Token'ı Supabase'e sorarak gerçek Kullanıcı ID'sini buluyoruz
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or fake user session!' });
  }

  const verifiedUserId = user.id; // Artık trollerin manipüle edemeyeceği gerçek ID elimizde

  // 4. GÜVENLİ SQL FONKSİYONUNU ÇALIŞTIR
  const { data, error } = await supabase.rpc('feed_character_secure', {
    choice_param: choice,
    user_id_param: verifiedUserId // Doğrulanmış ID'yi gönderiyoruz
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  return res.status(200).json(data);
}