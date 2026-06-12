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
      style={{ borderColor: 'rgba(255,251,213,0.1)' }}
    >
      <span className="font-raleway font-medium text-xs tracking-wider w-32"
        style={{ color: 'rgba(255,251,213,0.5)' }}>{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-raleway font-black text-xl" style={{ color: '#FFFBD5' }}>
          {count}
        </span>
        <span className="font-raleway text-xs" style={{ color: 'rgba(255,251,213,0.4)' }}>{unit}</span>
      </div>
    </motion.div>
  );
};

const SizeTag = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="font-raleway font-medium text-[10px] tracking-wider"
      style={{ color: 'rgba(255,251,213,0.45)' }}>{label}</span>
    <div className="px-3 py-1 rounded-sm font-raleway font-black text-sm"
      style={{ border: '1px solid rgba(212,180,131,0.4)', color: '#d4b483', background: 'rgba(212,180,131,0.07)' }}>
      {value}
    </div>
  </div>
);

export default function ResultsScreen({ measurements: m, setup, onRescan, onHome }: Props) {
  const sizes = getSizeRecommendation(m, setup.gender);

  return (
    <div className="relative w-full h-full overflow-y-auto flex flex-col items-center px-4 py-6"
      style={{ background: 'linear-gradient(180deg, #034543 0%, #023836 100%)' }}>

      {/* Corner decorations */}
      {[['top-4 left-4', 'border-t border-l'], ['top-4 right-4', 'border-t border-r'],
        ['bottom-4 left-4', 'border-b border-l'], ['bottom-4 right-4', 'border-b border-r']].map(([pos, b]) => (
        <div key={pos} className={`absolute ${pos} w-5 h-5 ${b} opacity-20`}
          style={{ borderColor: '#FFFBD5' }} />
      ))}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mb-6 text-center"
      >
        <div className="flex items-center gap-2 justify-center mb-1">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#88c98b' }} />
          <p className="font-raleway font-semibold text-xs tracking-widest"
            style={{ color: '#88c98b' }}>SCAN SELESAI</p>
        </div>
        <h2 className="font-raleway font-black text-2xl tracking-wider" style={{ color: '#FFFBD5' }}>
          UKURAN TUBUHMU
        </h2>
        <div className="h-px mt-2 mx-auto w-40"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,251,213,0.4), transparent)' }} />
      </motion.div>

      <div className="w-full max-w-sm space-y-4">
        {/* Body measurements panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="holo-panel rounded-sm p-4"
        >
          <p className="font-raleway font-semibold text-xs tracking-widest mb-1"
            style={{ color: 'rgba(255,251,213,0.55)' }}>◈ PENGUKURAN TUBUH</p>
          <p className="font-raleway text-[10px] mb-3"
            style={{ color: 'rgba(255,251,213,0.3)' }}>
            Estimasi AI · Kamera depan · Tinggi input: {m.height}cm
          </p>

          <MeasureRow label="TINGGI" value={m.height} unit="cm" delay={0.15} />
          <MeasureRow label="DADA / BUST" value={m.chest} unit="cm" delay={0.2} />
          <MeasureRow label="PINGGANG" value={m.waist} unit="cm" delay={0.25} />
          <MeasureRow label="PINGGUL" value={m.hips} unit="cm" delay={0.3} />
          <MeasureRow label="LEBAR BAHU" value={m.shoulderWidth} unit="cm" delay={0.35} />
          <MeasureRow label="PANJANG KAKI" value={m.inseam} unit="cm" delay={0.4} />
          <MeasureRow label="PANJANG TORSO" value={m.torsoLength} unit="cm" delay={0.45} />
          <MeasureRow label="PANJANG LENGAN" value={m.armLength} unit="cm" delay={0.5} />
        </motion.div>

        {/* Tops size panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="holo-panel rounded-sm p-4"
          style={{ borderColor: 'rgba(212,180,131,0.25)' }}
        >
          <p className="font-raleway font-semibold text-xs tracking-widest mb-3"
            style={{ color: 'rgba(212,180,131,0.8)' }}>◈ UKURAN ATASAN</p>
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
          style={{ borderColor: 'rgba(212,180,131,0.25)' }}
        >
          <p className="font-raleway font-semibold text-xs tracking-widest mb-3"
            style={{ color: 'rgba(212,180,131,0.8)' }}>◈ UKURAN BAWAHAN</p>
          <div className="flex justify-around mb-3">
            <SizeTag label="US WAIST" value={sizes.bottoms.us} />
            <SizeTag label="EU" value={sizes.bottoms.eu + 'cm'} />
            <SizeTag label="UK" value={sizes.bottoms.uk} />
          </div>
          <div className="flex justify-center">
            <div className="flex flex-col items-center">
              <span className="font-raleway font-medium text-[10px] tracking-wider"
                style={{ color: 'rgba(255,251,213,0.4)' }}>UKURAN JEANS</span>
              <div className="mt-1 px-5 py-1.5 rounded-sm font-raleway font-black text-base"
                style={{ border: '1px solid rgba(255,251,213,0.3)', color: '#FFFBD5', background: 'rgba(255,251,213,0.06)' }}>
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
          style={{ border: '1px solid rgba(212,180,131,0.2)', background: 'rgba(212,180,131,0.04)' }}
        >
          <p className="font-raleway text-[10px] leading-relaxed"
            style={{ color: 'rgba(212,180,131,0.7)' }}>
            ⚠ Ukuran merupakan estimasi AI dari kamera 2D. Ukuran aktual mungkin berbeda ±5–10%. Coba pakaian sebelum membeli.
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
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm btn-cyber font-raleway font-bold text-xs tracking-wider cursor-pointer"
          >
            <Home size={14} /> HOME
          </button>
          <button
            onClick={onRescan}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm btn-cyber-solid font-raleway font-black text-xs tracking-wider cursor-pointer"
          >
            <RefreshCw size={14} /> SCAN ULANG
          </button>
        </motion.div>
      </div>
    </div>
  );
}
