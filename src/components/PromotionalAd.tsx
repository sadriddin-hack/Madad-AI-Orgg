import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, PlayCircle } from "lucide-react";
import api from "@/src/lib/api";

interface AdData {
  text: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  updatedAt: number;
}

export default function PromotionalAd() {
  const [ad, setAd] = useState<AdData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    const checkAd = async () => {
      const lastShown = localStorage.getItem("madad_last_ad_show") || "0";
      const now = Date.now();
      
      // Let's check ad every 5 minutes to be responsive to admin edits
      const AD_INTERVAL = 5 * 60 * 1000;

      try {
        const res = await api.get("/config");
        const serverAd = res.data.promoAd;

        if (serverAd && serverAd.mediaUrl) {
          setAd(serverAd);
          if (now - parseInt(lastShown) > AD_INTERVAL) {
            showAd();
          }
          return;
        }
      } catch (err) {
        console.warn("Skipping ad loading from server due to connection or initial load delay", err);
      }

      // Fallback to local storage if offline or not loaded on server yet
      const savedAd = localStorage.getItem("madad_promo_ad");
      if (savedAd) {
        const adData: AdData = JSON.parse(savedAd);
        setAd(adData);

        if (now - parseInt(lastShown) > AD_INTERVAL) {
          showAd();
        }
      }
    };

    const showAd = () => {
      setIsVisible(true);
      setTimeLeft(10);
      localStorage.setItem("madad_last_ad_show", Date.now().toString());

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsVisible(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    };

    // Check once immediately, then every 30 seconds
    checkAd();
    const interval = setInterval(checkAd, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!ad || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 pointer-events-none"
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto" onClick={() => setIsVisible(false)} />
        
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative max-w-4xl w-full glass-dark rounded-[2.5rem] overflow-hidden shadow-2xl pointer-events-auto border border-white/10"
        >
          <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
             <div className="bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-xs font-bold text-white/80">
               Реклама: {timeLeft}с
             </div>
             <button 
               onClick={() => setIsVisible(false)}
               className="p-2 bg-black/50 backdrop-blur-md hover:bg-black/70 rounded-full text-white transition-all border border-white/10"
             >
               <X className="w-5 h-5" />
             </button>
          </div>

          <div className="flex flex-col md:flex-row h-full">
            <div className="w-full md:w-2/3 aspect-video md:aspect-auto bg-black flex items-center justify-center relative group">
              {ad.mediaType === 'image' ? (
                <img 
                  src={ad.mediaUrl} 
                  alt="Promotion" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <video 
                  src={ad.mediaUrl} 
                  autoPlay 
                  muted 
                  playsInline 
                  loop 
                  className="w-full h-full object-contain"
                />
              )}
              {ad.mediaType === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <PlayCircle className="w-16 h-16 text-white" />
                </div>
              )}
            </div>

            <div className="w-full md:w-1/3 p-8 md:p-10 flex flex-col justify-center space-y-6 bg-gradient-to-br from-gray-900 to-black">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-medical-green uppercase tracking-[0.3em]">Таблиғот</span>
                <h2 className="text-2xl font-bold leading-tight text-white">
                  {ad.text || "Хабарномаи муҳим аз MADAD AI"}
                </h2>
              </div>
              
              <div className="h-1 w-12 bg-medical-green rounded-full" />
              
              <p className="text-gray-400 text-sm leading-relaxed">
                Ин таблиғот ба таври худкор пас аз 10 сония нест мешавад. Ташаккур барои истифода аз хизматрасониҳои мо.
              </p>

              <button 
                onClick={() => setIsVisible(false)}
                className="w-full py-4 medical-gradient rounded-2xl font-bold shadow-lg hover:shadow-medical-green/20 transition-all text-sm uppercase tracking-widest"
              >
                Пӯшидан
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
