import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";

interface AppraisalRPMGaugeProps {
  progress: number;
  stage: 1 | 2 | 3;
  isProcessing?: boolean;
}

const stageLabels = {
  1: { main: "Warming Up...", sub: "Analyzing VIN" },
  2: { main: "Accelerating...", sub: "Live Market Search" },
  3: { main: "Redline!", sub: "Finalizing Deal" },
};

export function AppraisalRPMGauge({ progress, stage, isProcessing = true }: AppraisalRPMGaugeProps) {
  const needleControls = useAnimation();
  const [displayProgress, setDisplayProgress] = useState(0);

  const clampedProgress = Math.max(0, Math.min(100, progress));
  const needleRotation = (clampedProgress / 100) * 180 - 90;

  useEffect(() => {
    setDisplayProgress(clampedProgress);
    
    if (isProcessing) {
      needleControls.start({
        rotate: [needleRotation - 3, needleRotation + 3, needleRotation - 2, needleRotation + 2, needleRotation],
        transition: {
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        },
      });
    } else {
      needleControls.start({
        rotate: needleRotation,
        transition: { duration: 0.8, ease: "easeOut" },
      });
    }
  }, [clampedProgress, isProcessing, needleControls, needleRotation]);

  const getZoneColor = (percent: number) => {
    if (percent <= 40) return "text-emerald-500";
    if (percent <= 80) return "text-amber-500";
    return "text-red-500";
  };

  const getGlowColor = (percent: number) => {
    if (percent <= 40) return "shadow-emerald-500/50";
    if (percent <= 80) return "shadow-amber-500/50";
    return "shadow-red-500/50";
  };

  const getNeedleGlow = (percent: number) => {
    if (percent <= 40) return "0 0 15px rgba(16, 185, 129, 0.7)";
    if (percent <= 80) return "0 0 18px rgba(245, 158, 11, 0.7)";
    return "0 0 22px rgba(239, 68, 68, 0.8)";
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative w-72 h-44">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <defs>
            <linearGradient id="appraisalGreenZone" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="appraisalYellowZone" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="appraisalRedZone" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="appraisalVioletGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <filter id="appraisalGlow">
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
            stroke="url(#appraisalGreenZone)"
            strokeWidth="14"
            strokeLinecap="round"
            className="drop-shadow-lg"
          />

          <path
            d="M 100 20 A 80 80 0 0 1 164 56"
            fill="none"
            stroke="url(#appraisalYellowZone)"
            strokeWidth="14"
            strokeLinecap="round"
            className="drop-shadow-lg"
          />

          <path
            d="M 164 56 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#appraisalRedZone)"
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
          <circle cx="100" cy="100" r="28" fill="#1e293b" stroke="url(#appraisalVioletGlow)" strokeWidth="2" filter="url(#appraisalGlow)" />
          
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
            style={{ boxShadow: getNeedleGlow(displayProgress) }}
          />
        </motion.div>

        <motion.div 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1"
        >
          <div 
            className="w-4 h-4 rounded-full bg-slate-800 border-2 border-violet-500"
            style={{ boxShadow: "0 0 15px rgba(139, 92, 246, 0.6)" }}
          />
        </motion.div>

        {stage === 3 && (
          <motion.div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="text-red-500 font-bold text-xs tracking-wider">REDLINE</span>
          </motion.div>
        )}
      </div>

      <motion.div 
        className="mt-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.p 
          className={`text-lg font-bold ${getZoneColor(displayProgress)}`}
          key={stage}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          {stageLabels[stage].main}
        </motion.p>
        <motion.p 
          className="text-sm text-slate-400 mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {stageLabels[stage].sub}
        </motion.p>
      </motion.div>

      <motion.div 
        className="mt-3 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex gap-1">
          {[1, 2, 3].map((s) => (
            <motion.div
              key={s}
              className={`w-2 h-2 rounded-full ${
                s <= stage 
                  ? s === 1 ? "bg-emerald-500" : s === 2 ? "bg-amber-500" : "bg-red-500"
                  : "bg-slate-700"
              }`}
              animate={s === stage ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.6, repeat: s === stage ? Infinity : 0 }}
            />
          ))}
        </div>
        <span className="text-xs text-slate-500">Stage {stage}/3</span>
      </motion.div>

      <motion.div
        className="mt-4 w-52 h-1.5 bg-slate-800 rounded-full overflow-hidden"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className={`h-full rounded-full ${
            displayProgress <= 40 ? "bg-gradient-to-r from-emerald-600 to-emerald-400" :
            displayProgress <= 80 ? "bg-gradient-to-r from-emerald-500 via-amber-500 to-amber-400" :
            "bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${displayProgress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </motion.div>
    </div>
  );
}

export function AppraisalLoadingOverlay({ stage, progress }: { stage: 1 | 2 | 3; progress: number }) {
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
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-white">AI Analysis in Progress</h3>
          <p className="text-sm text-slate-400 mt-1">Searching live market data...</p>
        </div>
        <AppraisalRPMGauge progress={progress} stage={stage} isProcessing={true} />
      </motion.div>
    </motion.div>
  );
}
