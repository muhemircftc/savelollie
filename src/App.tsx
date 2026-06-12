import { Turnstile } from '@marsidev/react-turnstile';
import { useEffect, useState, useRef } from 'react';
import { supabase, initializeUser } from './supabaseClient';
import { GAME_CONFIG } from './gameConfig';
import OceanScene from './OceanScene';
import './App.css';

function App() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [, setUser] = useState<any>(null);
  const [distance, setDistance] = useState<number>(10000); 
  const [loading, setLoading] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [hasFedToday, setHasFedToday] = useState<boolean>(false);

  // 🧠 SİMÜLASYON SİSTEMİ: Başlangıç değerlerini 10 olarak atıyoruz (0'dan başlamasın diye)
  const [recentSharkCount, setRecentSharkCount] = useState<number>(10);
  const [recentLollieCount, setRecentLollieCount] = useState<number>(10);

  const channelRef = useRef<any>(null);
  const soundTimerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Veritabanından ana mesafeyi çeken fonksiyon (30 saniyede bir çalışır)
  const fetchGameState = async () => {
    const { data, error } = await supabase.from('game_state').select('distance').single();
    if (!error && data) {
      setDistance(data.distance);
    }
  };

  useEffect(() => {
    const setupGame = async () => {
      const currentUser = await initializeUser();
      setUser(currentUser);
      await fetchGameState();

      if (currentUser) {
        const todayStr = new Date().toISOString().split('T')[0];
        
        const { data: logData } = await supabase
          .from('feed_logs')
          .select('fingerprint')
          .eq('fingerprint', currentUser.id)
          .eq('feed_date', todayStr)
          .maybeSingle();

        if (logData || localStorage.getItem('last_feed_date') === todayStr) {
          setHasFedToday(true);
        }
      }
    };
    setupGame();

    const interval = setInterval(fetchGameState, 30000);
    return () => clearInterval(interval);
  }, []);

  // ⚡ CANLI MESAFE YAYINI: Diğer oyuncuların yarattığı mesafeyi anlık senkronize eder
  useEffect(() => {
    const myChannel = supabase.channel('global_feeds');
    myChannel
      .on('broadcast', { event: 'distance_update' }, ({ payload }) => {
        setDistance(payload.distance);
      })
      .subscribe();

    channelRef.current = myChannel;
    return () => { supabase.removeChannel(myChannel); };
  }, []);

  // 🧠 AKILLI OYUNCU SİMÜLASYONU (Günün saatine göre organik dalgalanma motoru)
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      const hour = new Date().getHours();
      
      // Standart saatler için limitler (07:00 - 17:00)
      let minVal = 8;
      let maxVal = 18;

      if (hour >= 18 && hour <= 23) { 
        // Akşam saatleri: Trafik yoğun simülasyonu
        minVal = 22; 
        maxVal = 45; 
      } else if (hour >= 1 && hour <= 6) { 
        // Gece/Sabah karşı: Trafik çok sakin simülasyonu
        minVal = 1; 
        maxVal = 6; 
      }

      // Shark sayacını güncelle
      setRecentSharkCount((current) => {
        if (current > maxVal) return current - (Math.floor(Math.random() * 2) + 1);
        if (current < minVal) return current + (Math.floor(Math.random() * 2) + 1);
        return current + (Math.floor(Math.random() * 3) - 1); // Organik -1, 0, +1 oynama
      });

      // Lollie sayacını güncelle
      setRecentLollieCount((current) => {
        if (current > maxVal) return current - (Math.floor(Math.random() * 2) + 1);
        if (current < minVal) return current + (Math.floor(Math.random() * 2) + 1);
        return current + (Math.floor(Math.random() * 3) - 1);
      });

    }, 2500); // Her 2.5 saniyede bir sayıları hafifçe esnetir

    return () => clearInterval(simulationInterval);
  }, []);

  useEffect(() => {
    if (isMuted) {
      if (soundTimerRef.current) clearTimeout(soundTimerRef.current);
      return;
    }
    const playLoop = () => {
      triggerSubmarineThump();
      const nextInterval = 300 + (distance / 10000) * 1300;
      soundTimerRef.current = setTimeout(playLoop, nextInterval);
    };
    const baseInterval = 300 + (distance / 10000) * 1300;
    soundTimerRef.current = setTimeout(playLoop, baseInterval);
    return () => { if (soundTimerRef.current) clearTimeout(soundTimerRef.current); };
  }, [distance, isMuted]);

  const triggerSubmarineThump = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'suspended') return;
      playSingleVibration(ctx, 0, 110);      
      playSingleVibration(ctx, 0.12, 90);   
    } catch (e) {}
  };

  const playSingleVibration = (ctx: AudioContext, startTime: number, frequency: number) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + 0.1);
    gainNode.gain.setValueAtTime(0.6, ctx.currentTime + startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + 0.12);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + 0.14);
  };

  const toggleSound = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();
    setIsMuted((prev) => {
      const nextMutedState = !prev;
      if (!nextMutedState) {
        playSingleVibration(ctx, 0, 120);
        playSingleVibration(ctx, 0.12, 100);
      }
      return nextMutedState;
    });
  };

  const handleFeed = async (choice: 'lollie' | 'shark') => {
    if (loading || hasFedToday || distance <= 0) return;
    
    if (!captchaToken) {
      alert("Lütfen oyuna müdahale etmeden önce insan olduğunuzu doğrulayın.");
      return;
    }

    setLoading(true);

    try {
      triggerInterstitialAd(); 
      
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        console.error("Oturum doğrulanamadı.");
        setLoading(false);
        return;
      }

      const response = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          choice: choice, 
          captchaToken: captchaToken, 
          token: token 
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success === true) {
        // 🟢 İLLÜZYON BAĞI: Kullanıcı hangi butona bastıysa, o sayacı el değerimizle anında +1 artırıyoruz!
        if (choice === 'shark') {
          setRecentSharkCount((prev) => prev + 1);
        } else {
          setRecentLollieCount((prev) => prev + 1);
        }

        setDistance(data.new_distance);
        
        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem('last_feed_date', todayStr);
        setHasFedToday(true);

        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'distance_update',
            payload: { distance: data.new_distance }
          });
        }
      } else if (data.error === 'ALREADY_FED_TODAY') {
        setHasFedToday(true);
        alert("Bugün zaten oy hakkınızı kullandınız!");
      } else {
        console.error("Hata:", data.error);
      }
    } catch (err) {
      console.error("Bağlantı hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerInterstitialAd = () => {
    if ((window as any).showMonetagInterstitial) {
      (window as any).showMonetagInterstitial();
    }
    console.log(`[MONETAG AD TRIGERED]: ${GAME_CONFIG.ads.interstitialId}`);
  };

  return (
    <div className="game-container">
      <div className="fullscreen-3d-environment">
        <OceanScene distance={distance} />
      </div>

      <div className="ad-banner top-banner">
        <div id={GAME_CONFIG.ads.topBannerId}></div>
      </div>

      <main className="game-ui-layer">
        <div className="top-control-bar">
          <div className={`intensity-box shark-intensity ${recentSharkCount > 0 ? 'active' : ''}`}>
            SHARK: {recentSharkCount}
          </div>
          <button className={`audio-toggle ${!isMuted ? 'playing' : 'muted'}`} onClick={toggleSound}>
            {isMuted ? 'SOUND: OFF' : 'SOUND: ON'}
          </button>
          <div className={`intensity-box lollie-intensity ${recentLollieCount > 0 ? 'active' : ''}`}>
            LOLLIE: {recentLollieCount}
          </div>
        </div>

        <div className="action-area">
          <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
            <Turnstile 
              siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY} 
              onSuccess={(token) => setCaptchaToken(token)} 
              options={{ theme: 'dark' }}
            />
          </div>
          
          <div className="button-group">
            <button 
              className="btn btn-shark" 
              disabled={loading || hasFedToday || distance <= 0} 
              onClick={() => handleFeed('shark')}
            >
              FEED
            </button>
            <button 
              className="btn btn-lollie" 
              disabled={loading || hasFedToday || distance <= 0} 
              onClick={() => handleFeed('lollie')}
            >
              FEED
            </button>
          </div>
          <a href="mailto:lolliethefish@gmail.com" className="mail-redirect-text">
            Want to feed with your own bait? Get in touch!
          </a>
        </div>
      </main>

      <div className="ad-banner bottom-banner">
        <div id={GAME_CONFIG.ads.bottomBannerId}></div>
      </div>
    </div>
  );
}

export default App;