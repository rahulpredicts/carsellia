import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";

interface MarketTrendsRPMGaugeProps {
  isLoading?: boolean;
  loadingText?: string;
}

export function MarketTrendsRPMGauge({ isLoading = true, loadingText = "Loading Market Data..." }: MarketTrendsRPMGaugeProps) {
  const needleControls = useAnimation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.random() * 15;
          return next > 95 ? 20 : next;
        });
      }, 300);
      
      needleControls.start({
        rotate: [-80, -20, -60, 10, -40, 30, -50],
        transition: {
          duration: 2.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        },
      });
      
      return () => clearInterval(interval);
    } else {
      needleControls.start({
        rotate: 0,
        transition: { duration: 0.8, ease: "easeOut" },
      });
    }
  }, [isLoading, needleControls]);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-72 h-44">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <defs>
            <linearGradient id="mktGreenZone" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="mktYellowZone" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="mktRedZone" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="mktVioletGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <filter id="mktGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M 20 100 A 80 80 0 0 1 100 20"
            fill="none"
            stroke="url(#mktGreenZone)"
            strokeWidth="14"
            strokeLinecap="round"
            className="drop-shadow-lg"
          />

          <path
            d="M 100 20 A 80 80 0 0 1 164 56"
            fill="none"
            stroke="url(#mktYellowZone)"
            strokeWidth="14"
            strokeLinecap="round"
            className="drop-shadow-lg"
          />

          <path
            d="M 164 56 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#mktRedZone)"
            strokeWidth="14"
            strokeLinecap="round"
            className="drop-shadow-lg"
          />

          {[0, 20, 40, 60, 80, 100].map((tick, i) => {
            const angle = ((tick / 100) * 180 - 90) * (Math.PI / 180);
            const innerRadius = 60;
            const outerRadius = 68;
            const x1 = 100 + innerRadius * Math.cos(angle);
            const y1 = 100 + innerRadius * Math.sin(angle);
            const x2 = 100 + outerRadius * Math.cos(angle);
            const y2 = 100 + outerRadius * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#64748b"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}

          <text x="25" y="95" className="fill-slate-400 text-[8px] font-medium">0</text>
          <text x="55" y="45" className="fill-slate-400 text-[8px] font-medium">2</text>
          <text x="95" y="25" className="fill-slate-400 text-[8px] font-medium">4</text>
          <text x="135" y="45" className="fill-slate-400 text-[8px] font-medium">6</text>
          <text x="165" y="95" className="fill-slate-400 text-[8px] font-medium">8</text>

          <circle cx="100" cy="100" r="32" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <circle cx="100" cy="100" r="28" fill="#1e293b" stroke="url(#mktVioletGlow)" strokeWidth="2" filter="url(#mktGlow)" />
          
          <text x="100" y="94" textAnchor="middle" className="fill-violet-400 text-[9px] font-bold tracking-wider">
            Carsellia
          </text>
          <text x="100" y="106" textAnchor="middle" className="fill-white text-[11px] font-bold tracking-widest">
            RPM
          </text>
        </svg>

        <motion.div
          className="absolute bottom-[8px] left-1/2 origin-bottom"
          style={{ 
            width: "4px", 
            height: "65px",
            marginLeft: "-2px"
          }}
          animate={needleControls}
          initial={{ rotate: -90 }}
        >
          <div 
            className="w-full h-full rounded-t-full bg-gradient-to-t from-violet-900 via-violet-400 to-white"
            style={{
              boxShadow: "0 0 20px rgba(139, 92, 246, 0.8)"
            }}
          />
        </motion.div>

        <motion.div 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1"
        >
          <div className="w-4 h-4 rounded-full bg-slate-800 border-2 border-violet-500 shadow-lg" 
            style={{ boxShadow: "0 0 15px rgba(139, 92, 246, 0.6)" }}
          />
        </motion.div>
      </div>

      <motion.div 
        className="mt-6 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.p 
          className="text-lg font-bold text-violet-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {loadingText}
        </motion.p>
        <p className="text-sm text-slate-500 mt-1">
          Fetching Canadian market intelligence...
        </p>
      </motion.div>

      <motion.div
        className="mt-4 flex gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-violet-500"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </motion.div>

      <motion.div
        className="mt-4 w-52 h-1.5 bg-slate-800 rounded-full overflow-hidden"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-400"
          animate={{ width: ["0%", "100%", "30%", "80%", "50%", "90%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}

export function MarketTrendsLoadingOverlay({ loadingText }: { loadingText?: string }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-violet-500/30 p-10 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        style={{ boxShadow: "0 0 60px rgba(139, 92, 246, 0.2)" }}
      >
        <MarketTrendsRPMGauge loadingText={loadingText} />
      </motion.div>
    </motion.div>
  );
}
