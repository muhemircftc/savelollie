import { Turnstile } from '@marsidev/react-turnstile';
import { useEffect, useState, useRef } from 'react';
import { supabase, initializeUser } from './supabaseClient';
import OceanScene from './OceanScene';
import './App.css';

function App() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [distance, setDistance] = useState<number>(10000); 
  const [loading, setLoading] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [hasFedToday, setHasFedToday] = useState<boolean>(false);

  // 🧠 smart simulation counters
  const [recentSharkCount, setRecentSharkCount] = useState<number>(10);
  const [recentLollieCount, setRecentLollieCount] = useState<number>(10);

  // 📡 LIVE BATTLE FLOW (TICKET) STATE STRUCTURE
  const [tickerMessage, setTickerMessage] = useState<string>("CONNECTING TO GLOBAL SATELLITE FEED...");
  const [tickerClass, setTickerClass] = useState<string>("feed-lollie-action");

  const soundTimerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const fetchGameState = async () => {
    const { data, error } = await supabase.from('game_state').select('distance').single();
    if (!error && data) {
      setDistance(data.distance);
    }
  };

  useEffect(() => {
    const setupGame = async () => {
      const currentUser = await initializeUser();
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

    // 🟢 UPDATE: Distance is guaranteed and retrieved from the database free of charge every 2 seconds.
    const interval = setInterval(fetchGameState, 2000);
    return () => clearInterval(interval);
  }, []);


  // 🧠 GAMER AND LIVE STREAMING SIMULATION ENGINE
  useEffect(() => {
    const locations = [
      "someone in ABU DHABI", "someone in ABUJA", "someone in ACCRA", "someone in ADDIS ABABA",
      "someone in ALGIERS", "someone in AMMAN", "someone in AMSTERDAM", "someone in ANDORRA LA VELLA",
      "someone in ANKARA", "someone in ANTANANARIVO", "someone in APIA", "someone in ASHGABAT", 
      "someone in ASMARA", "someone in ASTANA", "someone in ASUNCION", "someone in ATHENS",
      "someone in BAGHDAD", "someone in BAKU", "someone in BAMAKO", "someone in BANDAR SERI BEGAWAN",
      "someone in BANGKOK", "someone in BANGUI", "someone in BANJUL", "someone in BASSETERRE",
      "someone in BEIJING", "someone in BEIRUT", "someone in BELGRADE", "someone in BELMOPAN",
      "someone in BERLIN", "someone in BERN", "someone in BISHKEK", "someone in BISSAU",
      "someone in BOGOTA", "someone in BRASILIA", "someone in BRATISLAVA", "someone in BRAZZAVILLE",
      "someone in BRIDGETOWN", "someone in BRUSSELS", "someone in BUCHAREST", "someone in BUDAPEST",
      "someone in BUENOS AIRES", "someone in CAIRO", "someone in CANBERRA", "someone in CARACAS",
      "someone in CASTRIES", "someone in CHICAGO", "someone in CHISINAU", "someone in CONAKRY",
      "someone in COPENHAGEN", "someone in DAKAR", "someone in DAMASCUS", "someone in DHAKA",
      "someone in DILI", "someone in DJIBOUTI", "someone in DODOMA", "someone in DOHA",
      "someone in DUBAI", "someone in DUBLIN", "someone in DUSHANBE", "someone in FREETOWN",
      "someone in FUNAFUTI", "someone in GABORONE", "someone in GEORGETOWN", "someone in GITEGA",
      "someone in GUATEMALA CITY", "someone in HANOI", "someone in HARARE", "someone in HAVANA",
      "someone in HELSINKI", "someone in HONIARA", "someone in ISLAMABAD", "someone in JAKARTA",
      "someone in JERUSALEM", "someone in JUBA", "someone in KABUL", "someone in KAMPALA",
      "someone in KATHMANDU", "someone in KHARTOUM", "someone in KIGALI", "someone in KINGSTON",
      "someone in KINGSTOWN", "someone in KINSHASA", "someone in KUALA LUMPUR", "someone in KUWAIT CITY",
      "someone in KYIV", "someone in LIBREVILLE", "someone in LILONGWE", "someone in LIMA",
      "someone in LISBON", "someone in LJUBLJANA", "someone in LOME", "someone in LONDON",
      "someone in LOS ANGELES", "someone in LUANDA", "someone in LUSAKA", "someone in LUXEMBOURG",
      "someone in MADRID", "someone in MAJURO", "someone in MALABO", "someone in MALE",
      "someone in MANAGUA", "someone in MANAMA", "someone in MANILA", "someone in MAPUTO",
      "someone in MASERU", "someone in MBABANE", "someone in MEXICO CITY", "someone in MINSK",
      "someone in MOGADISHU", "someone in MONACO", "someone in MONROVIA", "someone in MONTEVIDEO",
      "someone in MORONI", "someone in MOSCOW", "someone in MUSCAT", "someone in N'DJAMENA",
      "someone in NAIROBI", "someone in NASSAU", "someone in NAYPYIDAW", "someone in NEW DELHI",
      "someone in NEW YORK", "someone in NGERULMUD", "someone in NIAMEY", "someone in NICOSIA",
      "someone in NOUAKCHOTT", "someone in NUKU'ALOFA", "someone in OSLO", "someone in OTTAWA",
      "someone in OUAGADOUGOU", "someone in PALIKIR", "someone in PANAMA CITY", "someone in PARAMARIBO",
      "someone in PARIS", "someone in PHNOM PENH", "someone in PODGORICA", "someone in PORT LOUIS",
      "someone in PORT MORESBY", "someone in PORT OF SPAIN", "someone in PORT VILA", "someone in PORT-AU-PRINCE",
      "someone in PORTO-NOVO", "someone in PRAGUE", "someone in PRAIA", "someone in PRETORIA",
      "someone in PYONGYANG", "someone in QUITO", "someone in RABAT", "someone in REYKJAVIK",
      "someone in RIGA", "someone in RIYADH", "someone in ROME", "someone in ROSEAU",
      "someone in SAINT GEORGE'S", "someone in SAN JOSE", "someone in SAN MARINO", "someone in SAN SALVADOR",
      "someone in SANA'A", "someone in SANTIAGO", "someone in SANTO DOMINGO", "someone in SAO PAULO",
      "someone in SAO TOME", "someone in SARAJEVO", "someone in SEOUL", "someone in SINGAPORE",
      "someone in SKOPJE", "someone in SOFIA", "someone in SOUTH TARAWA", "someone in SRI JAYAWARDENEPURA KOTTE",
      "someone in STOCKHOLM", "someone in SUCRE", "someone in SUVA", "someone in TALLINN", "someone in TASHKENT",
      "someone in TBILISI", "someone in TEGUCIGALPA", "someone in TEHRAN", "someone in TEL AVIV",
      "someone in THIMPHU", "someone in TIRANA", "someone in TOKYO", "someone in TORONTO",
      "someone in TRIPOLI", "someone in TUNIS", "someone in ULAANBAATAR", "someone in VADUZ",
      "someone in VALLETTA", "someone in VAN", "someone in VICTORIA", "someone in VIENNA",
      "someone in VIENTIANE", "someone in VILNIUS", "someone in WARSAW", "someone in WASHINGTON, D.C.",
      "someone in WELLINGTON", "someone in WINDHOEK", "someone in YAOUNDE", "someone in YAREN", "someone in YEREVAN", "someone in ZAGREB"
    ];

    const simulationInterval = setInterval(() => {
      if (distance <= 0) return; 

      const hour = new Date().getHours();
      let minVal = 8;
      let maxVal = 18;

      if (hour >= 18 && hour <= 23) { 
        minVal = 22; 
        maxVal = 45; 
      } else if (hour >= 1 && hour <= 6) { 
        minVal = 1; 
        maxVal = 6; 
      }

      const randomUser = locations[Math.floor(Math.random() * locations.length)];
      const isSharkAction = Math.random() > 0.5;

      if (isSharkAction) {
        setRecentSharkCount((current) => {
          if (current > maxVal) return current - (Math.floor(Math.random() * 2) + 1);
          if (current < minVal) return current + (Math.floor(Math.random() * 2) + 1);
          return current + (Math.floor(Math.random() * 3) - 1);
        });
        setTickerClass("feed-shark-action");
        setTickerMessage(`🔴 ${randomUser} fed the shark!`);
      } else {
        setRecentLollieCount((current) => {
          if (current > maxVal) return current - (Math.floor(Math.random() * 2) + 1);
          if (current < minVal) return current + (Math.floor(Math.random() * 2) + 1);
          return current + (Math.floor(Math.random() * 3) - 1);
        });
        setTickerClass("feed-lollie-action");
        setTickerMessage(`🟢 ${randomUser} attached bait to Lollie!`);
      }

    }, 2500);

    return () => clearInterval(simulationInterval);
  }, [distance]);

  useEffect(() => {
    if (isMuted || distance <= 0) {
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
    } catch (e) {
      console.warn("Audio Context Warning:", e);
    }
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
    alert("Please verify that you are human before interfering in the game!");
    return;
  }

  setLoading(true);

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      console.error("The session could not be verified.");
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
      // 🚨 CRITICAL SECURITY UPDATE: We are definitely converting incoming data into numbers
      const secureNewDistance = Number(data.new_distance);

      let currentStepText = "0.500m";
      if (distance <= 500) currentStepText = "0.005m";
      else if (distance <= 2000) currentStepText = "0.020m";
      else if (distance <= 5000) currentStepText = "0.100m";

      if (choice === 'shark') {
        setRecentSharkCount((prev) => prev + 1);
        setTickerClass("feed-shark-action");
        setTickerMessage(`🔴 YOU FED THE SHARK! (-${currentStepText})`);
      } else {
        setRecentLollieCount((prev) => prev + 1);
        setTickerClass("feed-lollie-action");
        setTickerMessage(`🟢 YOU BOOSTED LOLLIE! (+${currentStepText})`);
      }

      // Update the State with a safe number.
      setDistance(secureNewDistance);
      
      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.setItem('last_feed_date', todayStr);
      setHasFedToday(true);
      
    } else if (data.error === 'ALREADY_FED_TODAY') {
      setHasFedToday(true);
      alert("You have already used your feed allowance today!");
    } else {
      console.error("Error:", data.error);
    }
  } catch (err) {
    console.error("Connection error:", err);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="game-container">
      {/* 3D Aquarium Area */}
      <div className="fullscreen-3d-environment">
        <OceanScene distance={distance} />
      </div>

      <main className="game-ui-layer">
        
        {/* 📊 TOP PANEL: CURRENT DISTANCE AND CONTROLS (ALL IN ONE PLACE AT THE TOP) */}
        <div style={{ textAlign: 'center', margin: '20px 0 10px 0', width: '100%', zIndex: 1001 }}>
          <span style={{ fontSize: '10px', color: '#64748b', letterSpacing: '3px', fontWeight: 'bold' }}>CURRENT DISTANCE</span>
          <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#f8fafc', margin: '2px 0 15px 0', fontFamily: 'monospace', textShadow: '0 0 15px rgba(248,250,252,0.4)' }}>
            {Number(distance).toFixed(3)} m
          </h1>

          {/* SOUND AND FINAL FEED QUANTITY BOXES (NOW DIRECTLY BELOW THE DISTANCE) */}
          <div className="top-control-bar" style={{ margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
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
        </div>

        <div className="action-area">
          <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
            <Turnstile 
              siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY} 
              onSuccess={(token) => setCaptchaToken(token)} 
              options={{ theme: 'dark' }}
            />
          </div>

          {/* 📡 CYBER LIVE STREAM PANEL (ABOVE THE FEED BUTTONS) */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '10px' }}>
            <div className="live-battle-feed">
              <div key={tickerMessage} className="feed-ticker-wrapper">
                <span className={`feed-item ${tickerClass}`}>{tickerMessage}</span>
              </div>
            </div>
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

      {/* 🚨 THE END FOREVER: A COMPLETELY BLACK FUNERAL MEMORIAL SCREEN */}
      {distance <= 0 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#000000', zIndex: 99999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '20px', textAlign: 'center'
        }}>
          
          {/* SHAREABLE MEMORIAL CARD CONTAINER */}
          <div style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '40px 30px',
            borderRadius: '12px',
            backgroundColor: '#050505',
            maxWidth: '500px',
            boxShadow: '0 0 40px rgba(0,0,0,1)',
            marginBottom: '30px'
          }}>
            <h1 style={{ 
              color: '#ffffff', 
              fontSize: '2.2rem', 
              fontWeight: '900', 
              marginBottom: '20px', 
              letterSpacing: '4px',
              fontFamily: 'monospace'
            }}>
              LOLLIE HAS PASSED AWAY.
            </h1>
            
            <p style={{ 
              color: '#888888', 
              fontSize: '15px', 
              lineHeight: '1.8', 
              margin: '0',
              fontFamily: 'serif',
              fontStyle: 'italic'
            }}>
              "To the honor of those who fought to keep her alive! This memory is yours!"
            </p>

            <div style={{ margin: '25px 0 5px 0', fontSize: '11px', color: '#444444', letterSpacing: '1px' }}>
              THE OCEAN IS NOW SILENT.
            </div>
          </div>
          
          {/* Monetag Smart Link Bridge */}
          <a 
            href="https://omg10.com/4/11160417" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{
              padding: '14px 35px', 
              fontSize: '13px', 
              fontWeight: 'bold', 
              textDecoration: 'none', 
              display: 'inline-block', 
              marginBottom: '15px', 
              backgroundColor: '#111111', 
              border: '2px solid #ef4444', 
              color: '#ef4444',
              borderRadius: '12px',
              letterSpacing: '1.5px',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.7)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            LEAVE A DIGITAL FLOWER IN MEMORY OF LOLLIE! 🥀
          </a>

          {/* X Share Button */}
          <button 
            onClick={() => {
              const shareText = `Lollie has passed away! In memory of everyone who tried to save her! The ocean will now be silent forever! #lolliehaspassedaway🖤`;
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
            }} 
            style={{ 
              padding: '14px 35px', 
              fontSize: '12px', 
              backgroundColor: '#ffffff', 
              color: '#000000', 
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '12px',
              letterSpacing: '1.5px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 15px rgba(255, 255, 255, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 255, 255, 0.6)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            SHARE THE MONUMENT ON X
          </button>

        </div>
      )}
    </div>
  );
}

export default App;
