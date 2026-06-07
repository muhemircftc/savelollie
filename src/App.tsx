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
  const [feedEvent, setFeedEvent] = useState<{ id: number; choice: 'lollie' | 'shark' } | null>(null);
  const [hasFedToday, setHasFedToday] = useState<boolean>(false);

  const [recentSharkCount, setRecentSharkCount] = useState<number>(0);
  const [recentLollieCount, setRecentLollieCount] = useState<number>(0);
  const sharkClicksRef = useRef<number[]>([]);
  const lollieClicksRef = useRef<number[]>([]);

  const channelRef = useRef<any>(null);
  const soundTimerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // KRİTER 6 & 15: Veritabanı masrafı için polling 30 saniyeye çıkarıldı (Yük azaltıldı)
  const fetchGameState = async () => {
    const { data, error } = await supabase.from('game_state').select('distance').single();
    if (!error && data) {
      setDistance(data.distance);
    }
  };

  useEffect(() => {
    const setupGame = async () => {
      // Anonim oturumu başlat ve kullanıcı bilgilerini al
      const currentUser = await initializeUser();
      setUser(currentUser);
      await fetchGameState();

      if (currentUser) {
        const todayStr = new Date().toISOString().split('T')[0];
        
        // KRİTER 1 & 9: Güvenli JWT doğrulama - Bu benzersiz üye bugün tıklama yaptı mı?
        const { data: logData } = await supabase
          .from('feed_logs')
          .select('fingerprint')
          .eq('fingerprint', currentUser.id) // Artık cihaz izi değil, şifreli kullanıcı ID'si aranıyor
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

  // KRİTER 5 & 15: Canlı Mesafe Yayını (Veritabanına sormadan mesafeyi anlık günceller)
  useEffect(() => {
    const myChannel = supabase.channel('global_feeds');
    myChannel
      .on('broadcast', { event: 'feed_click' }, ({ payload }) => {
        const clickTime = Date.now();
        if (payload.choice === 'shark') {
          sharkClicksRef.current.push(clickTime);
        } else if (payload.choice === 'lollie') {
          lollieClicksRef.current.push(clickTime);
        }
      })
      .on('broadcast', { event: 'distance_update' }, ({ payload }) => {
        // BAŞKA BİRİ TIKLADIĞINDA MESAFEYİ DB SORGUSU OLMADAN ANINDA GÜNCELLE
        setDistance(payload.distance);
      })
      .subscribe();

    channelRef.current = myChannel;
    return () => { supabase.removeChannel(myChannel); };
  }, []);

  useEffect(() => {
    const updateRecentCounts = () => {
      const now = Date.now();
      const tenSecondsAgo = now - 10000;
      sharkClicksRef.current = sharkClicksRef.current.filter(time => time > tenSecondsAgo);
      lollieClicksRef.current = lollieClicksRef.current.filter(time => time > tenSecondsAgo);
      setRecentSharkCount(sharkClicksRef.current.length);
      setRecentLollieCount(lollieClicksRef.current.length);
    };
    const counterTimer = setInterval(updateRecentCounts, 200);
    return () => clearInterval(counterTimer);
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
  
  // KULLANICI KUTUCUĞU ONAYLAMADIYSA UYAR
  if (!captchaToken) {
    alert("Lütfen oyuna müdahale etmeden önce insan olduğunuzu doğrulayın.");
    return;
  }

  const clickTime = Date.now();
  
  // Lokal tıklama efektleri (Ses, animasyon vb.)
  if (choice === 'shark') {
    sharkClicksRef.current.push(clickTime);
    setRecentSharkCount(sharkClicksRef.current.length);
  } else {
    lollieClicksRef.current.push(clickTime);
    setRecentLollieCount(lollieClicksRef.current.length);
  }

  // Diğer oyunculara animasyon gitsin diye Realtime tetiklemesi
  if (channelRef.current) {
    channelRef.current.send({
      type: 'broadcast',
      event: 'feed_click',
      payload: { choice }
    });
  }

  setFeedEvent({ id: clickTime, choice });
  setLoading(true);

 try {
    triggerInterstitialAd(); // Reklam tetikleyici
    
    // 1. Önce Supabase'den o anki anonim kullanıcının kimliğini (ID) çekiyoruz
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData.user?.id;

    if (!currentUserId) {
      console.error("Kullanıcı kimliği bulunamadı, oturum açılmamış olabilir.");
      setLoading(false);
      return;
    }

    // 2. YENİ GÜVENLİ KÖPRÜMÜZE (VERCEL API) İSTEK ATIYORUZ
    const response = await fetch('/api/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        choice: choice, 
        captchaToken: captchaToken, 
        userId: currentUserId // Hata veren yeri burası ile güncelledik
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success === true) {
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
        <OceanScene distance={distance} feedEvent={feedEvent} />
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
  
  {/* YENİ EKLENEN CLOUDFLARE KUTUSU */}
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