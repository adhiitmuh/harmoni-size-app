import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Home } from 'lucide-react';
import { BodyMeasurements, UserSetup } from '../types';
import { getSizeRecommendation } from '../utils/sizeChart';

interface Props {
  measurements: BodyMeasurements;
  setup: UserSetup;
  onRescan: () => void;
  onHome: () => void;
}

const useCountUp = (target: number, duration = 900) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.round(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
};

const MeasureRow = ({ label, value, unit, delay }: { label: string; value: number; unit: string; delay: number }) => {
  const count = useCountUp(value, 800);
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center justify-between py-2 border-b"
      style={{ borderColor: 'rgba(6,214,245,0.1)' }}
    >
      <span className="font-mono text-xs text-sky-500 tracking-wider w-28">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-orbitron text-xl font-bold" style={{ color: '#10f5a0', textShadow: '0 0 10px rgba(16,245,160,0.5)' }}>
          {count}
        </span>
        <span className="font-mono text-xs text-sky-600">{unit}</span>
      </div>
    </motion.div>
  );
};

const SizeTag = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="font-mono text-[10px] text-sky-600 tracking-wider">{label}</span>
    <div className="px-3 py-1 rounded-sm font-orbitron text-sm font-bold"
      style={{ border: '1px solid rgba(139,92,246,0.5)', color: '#c4b5fd', background: 'rgba(139,92,246,0.08)' }}>
      {value}
    </div>
  </div>
);

export default function ResultsScreen({ measurements: m, setup, onRescan, onHome }: Props) {
  const sizes = getSizeRecommendation(m, setup.gender);

  return (
    <div className="relative w-full h-full overflow-y-auto flex flex-col items-center px-4 py-6"
      style={{ background: 'linear-gradient(180deg, #030712 0%, #0a0f1e 100%)' }}>

      {/* Corner decorations */}
      {[['top-4 left-4', 'border-t-2 border-l-2'], ['top-4 right-4', 'border-t-2 border-r-2'],
        ['bottom-4 left-4', 'border-b-2 border-l-2'], ['bottom-4 right-4', 'border-b-2 border-r-2']].map(([pos, b]) => (
        <div key={pos} className={`absolute ${pos} w-5 h-5 ${b} opacity-30`} style={{ borderColor: '#06d6f5' }} />
      ))}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mb-6 text-center"
      >
        <div className="flex items-center gap-2 justify-center mb-1">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10f5a0' }} />
          <p className="font-mono text-xs tracking-widest text-emerald-400">SCAN COMPLETE</p>
        </div>
        <h2 className="font-orbitron text-2xl font-bold tracking-wider text-white">YOUR MEASUREMENTS</h2>
        <div className="h-px mt-2 mx-auto w-40"
          style={{ background: 'linear-gradient(90deg, transparent, #10f5a0, transparent)' }} />
      </motion.div>

      <div className="w-full max-w-sm space-y-4">
        {/* Body measurements panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="holo-panel rounded-sm p-4"
        >
          <p className="font-mono text-xs text-sky-500 tracking-widest mb-1">◈ BODY MEASUREMENTS</p>
          <p className="font-mono text-[10px] text-sky-700 mb-3">AI-estimated · Frontal camera · Input height: {m.height}cm</p>

          <MeasureRow label="HEIGHT" value={m.height} unit="cm" delay={0.15} />
          <MeasureRow label="CHEST / BUST" value={m.chest} unit="cm" delay={0.2} />
          <MeasureRow label="WAIST" value={m.waist} unit="cm" delay={0.25} />
          <MeasureRow label="HIPS" value={m.hips} unit="cm" delay={0.3} />
          <MeasureRow label="SHOULDER WIDTH" value={m.shoulderWidth} unit="cm" delay={0.35} />
          <MeasureRow label="INSEAM" value={m.inseam} unit="cm" delay={0.4} />
          <MeasureRow label="TORSO LENGTH" value={m.torsoLength} unit="cm" delay={0.45} />
          <MeasureRow label="ARM LENGTH" value={m.armLength} unit="cm" delay={0.5} />
        </motion.div>

        {/* Tops size panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="holo-panel rounded-sm p-4"
          style={{ borderColor: 'rgba(139,92,246,0.3)' }}
        >
          <p className="font-mono text-xs tracking-widest mb-3" style={{ color: '#a78bfa' }}>◈ TOPS / SHIRT SIZE</p>
          <div className="flex justify-around">
            <SizeTag label="US" value={sizes.tops.us} />
            <SizeTag label="EU" value={sizes.tops.eu} />
            <SizeTag label="UK" value={sizes.tops.uk} />
            <SizeTag label="ASIA" value={sizes.tops.asia} />
          </div>
        </motion.div>

        {/* Bottoms size panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="holo-panel rounded-sm p-4"
          style={{ borderColor: 'rgba(139,92,246,0.3)' }}
        >
          <p className="font-mono text-xs tracking-widest mb-3" style={{ color: '#a78bfa' }}>◈ BOTTOMS / PANTS SIZE</p>
          <div className="flex justify-around mb-3">
            <SizeTag label="US WAIST" value={sizes.bottoms.us} />
            <SizeTag label="EU" value={sizes.bottoms.eu + 'cm'} />
            <SizeTag label="UK" value={sizes.bottoms.uk} />
          </div>
          <div className="flex justify-center">
            <div className="flex flex-col items-center">
              <span className="font-mono text-[10px] text-sky-600 tracking-wider">JEANS SIZE</span>
              <div className="mt-1 px-5 py-1.5 rounded-sm font-orbitron font-bold text-base"
                style={{ border: '1px solid rgba(6,214,245,0.4)', color: '#67e8f9', background: 'rgba(6,214,245,0.06)' }}>
                {sizes.jeans}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="rounded-sm px-3 py-2"
          style={{ border: '1px solid rgba(245,166,35,0.2)', background: 'rgba(245,166,35,0.04)' }}
        >
          <p className="font-mono text-[10px] leading-relaxed" style={{ color: 'rgba(245,166,35,0.7)' }}>
            ⚠ Measurements are AI estimates from a 2D camera. Actual sizes may vary ±5–10%. Try garments before purchase.
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex gap-3 pb-2"
        >
          <button
            onClick={onHome}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm btn-cyber font-orbitron text-xs tracking-wider cursor-pointer"
          >
            <Home size={14} /> HOME
          </button>
          <button
            onClick={onRescan}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm btn-cyber-solid font-orbitron text-xs tracking-wider cursor-pointer"
          >
            <RefreshCw size={14} /> RESCAN
          </button>
        </motion.div>
      </div>
    </div>
  );
}
