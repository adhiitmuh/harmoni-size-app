import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, User, Users, PersonStanding, Footprints } from 'lucide-react';
import { UserSetup } from '../types';

interface Props {
  onComplete: (setup: UserSetup) => void;
  onBack: () => void;
}

export default function SetupScreen({ onComplete, onBack }: Props) {
  const [height, setHeight] = useState('170');
  const [gender, setGender] = useState<'male' | 'female' | 'unisex'>('unisex');
  const [unit, setUnit] = useState<'cm' | 'ft'>('cm');
  const [scanMode, setScanMode] = useState<'static' | 'walkby'>('static');

  const heightCm = unit === 'cm'
    ? parseFloat(height) || 170
    : Math.round((parseFloat(height) || 5.7) * 30.48);

  const valid = heightCm >= 100 && heightCm <= 250;

  const genderOptions: { id: 'male' | 'female' | 'unisex'; label: string; icon: React.ReactNode }[] = [
    { id: 'male', label: 'PRIA', icon: <User size={14} /> },
    { id: 'female', label: 'WANITA', icon: <User size={14} /> },
    { id: 'unisex', label: 'UNISEX', icon: <Users size={14} /> },
  ];

  const beige = '#FFFBD5';
  const beigeActive = { border: '1px solid rgba(255,251,213,0.7)', color: beige, background: 'rgba(255,251,213,0.08)' };
  const beigeInactive = { border: '1px solid rgba(255,251,213,0.18)', color: 'rgba(255,251,213,0.45)' };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-6 overflow-y-auto py-10"
      style={{ background: '#034543' }}>
      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-1.5 font-raleway font-semibold text-xs tracking-wider transition-opacity cursor-pointer opacity-50 hover:opacity-100"
        style={{ color: beige }}
      >
        <ChevronLeft size={14} /> KEMBALI
      </button>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <p className="font-raleway font-medium text-xs tracking-[0.3em] mb-2"
          style={{ color: 'rgba(255,251,213,0.45)' }}>LANGKAH 01 / 02</p>
        <h2 className="font-raleway font-black text-2xl tracking-wider" style={{ color: beige }}>PARAMETER TUBUH</h2>
        <div className="h-px mt-3 mx-auto w-32"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,251,213,0.4), transparent)' }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm space-y-4"
      >
        {/* Height input */}
        <div className="holo-panel rounded-sm p-5 corner-bracket">
          <div className="flex justify-between items-center mb-3">
            <label className="font-raleway font-semibold text-xs tracking-widest"
              style={{ color: 'rgba(255,251,213,0.6)' }}>TINGGI BADAN</label>
            <div className="flex gap-1">
              {(['cm', 'ft'] as const).map(u => (
                <button key={u}
                  onClick={() => {
                    if (u !== unit) {
                      setHeight(u === 'ft'
                        ? ((parseFloat(height) || 170) / 30.48).toFixed(1)
                        : String(Math.round((parseFloat(height) || 5.7) * 30.48)));
                      setUnit(u);
                    }
                  }}
                  className="font-raleway font-semibold text-xs px-2 py-0.5 rounded-sm transition-all cursor-pointer"
                  style={unit === u
                    ? { backgroundColor: beige, color: '#034543' }
                    : { color: 'rgba(255,251,213,0.5)', border: '1px solid rgba(255,251,213,0.2)' }}
                >{u}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={height}
              onChange={e => setHeight(e.target.value)}
              placeholder={unit === 'cm' ? '170' : '5.7'}
              className="input-cyber w-full px-4 py-3 rounded-sm text-2xl font-raleway font-bold tracking-wider"
            />
            <span className="font-raleway font-medium text-sm" style={{ color: 'rgba(255,251,213,0.5)' }}>{unit}</span>
          </div>
          {!valid && height !== '' && (
            <p className="font-raleway text-xs mt-2" style={{ color: '#e07a5f' }}>
              Masukkan tinggi yang valid (100–250 cm)
            </p>
          )}
          <p className="font-raleway text-xs mt-2" style={{ color: 'rgba(255,251,213,0.3)' }}>
            ≈ {heightCm} cm · untuk kalibrasi skala
          </p>
        </div>

        {/* Gender selection */}
        <div className="holo-panel rounded-sm p-5 corner-bracket">
          <label className="font-raleway font-semibold text-xs tracking-widest block mb-3"
            style={{ color: 'rgba(255,251,213,0.6)' }}>TIPE TUBUH / SIZE CHART</label>
          <div className="grid grid-cols-3 gap-2">
            {genderOptions.map(opt => (
              <button key={opt.id} onClick={() => setGender(opt.id)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-sm font-raleway font-bold text-xs tracking-wider transition-all cursor-pointer ${
                  gender === opt.id ? 'glow-cyan' : 'opacity-50 hover:opacity-80'
                }`}
                style={gender === opt.id ? beigeActive : beigeInactive}
              >
                {opt.icon}{opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scan mode toggle */}
        <div className="holo-panel rounded-sm p-5" style={{ borderColor: 'rgba(212,180,131,0.3)' }}>
          <label className="font-raleway font-semibold text-xs tracking-widest block mb-3"
            style={{ color: 'rgba(212,180,131,0.8)' }}>
            MODE SCAN
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setScanMode('static')}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-sm transition-all cursor-pointer"
              style={scanMode === 'static'
                ? { border: '1px solid rgba(255,251,213,0.6)', background: 'rgba(255,251,213,0.07)' }
                : { border: '1px solid rgba(212,180,131,0.2)', opacity: 0.5 }
              }
            >
              <PersonStanding size={20} style={{ color: scanMode === 'static' ? beige : '#d4b483' }} />
              <div>
                <p className="font-raleway font-bold text-xs tracking-wider text-center"
                  style={{ color: scanMode === 'static' ? beige : '#d4b483' }}>DIAM</p>
                <p className="font-raleway text-[10px] text-center mt-0.5"
                  style={{ color: 'rgba(255,251,213,0.35)' }}>Berdiri diam</p>
              </div>
              {scanMode === 'static' && (
                <div className="text-[9px] font-raleway text-center"
                  style={{ color: 'rgba(255,251,213,0.5)' }}>20 frame · presisi tinggi</div>
              )}
            </button>

            <button
              onClick={() => setScanMode('walkby')}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-sm transition-all cursor-pointer"
              style={scanMode === 'walkby'
                ? { border: '1px solid rgba(212,180,131,0.7)', background: 'rgba(212,180,131,0.07)' }
                : { border: '1px solid rgba(212,180,131,0.2)', opacity: 0.5 }
              }
            >
              <Footprints size={20} style={{ color: '#d4b483' }} />
              <div>
                <p className="font-raleway font-bold text-xs tracking-wider text-center"
                  style={{ color: '#d4b483' }}>WALK-BY</p>
                <p className="font-raleway text-[10px] text-center mt-0.5"
                  style={{ color: 'rgba(255,251,213,0.35)' }}>Jalan lewat kamera</p>
              </div>
              {scanMode === 'walkby' && (
                <div className="text-[9px] font-raleway text-center"
                  style={{ color: 'rgba(212,180,131,0.6)' }}>Auto-capture best frame</div>
              )}
            </button>
          </div>

          <p className="font-raleway text-[10px] mt-3 leading-relaxed"
            style={{ color: 'rgba(255,251,213,0.35)' }}>
            {scanMode === 'static'
              ? 'Berdiri di depan kamera, tunggu bar kalibrasi penuh, lalu capture.'
              : 'Jalan pelan melewati kamera. App otomatis tangkap frame terbaik saat badan menghadap kamera.'
            }
          </p>
        </div>

        {/* Start button */}
        <motion.button
          whileHover={{ scale: valid ? 1.02 : 1 }}
          whileTap={{ scale: valid ? 0.98 : 1 }}
          onClick={() => valid && onComplete({ heightCm, gender, scanMode })}
          disabled={!valid}
          className={`w-full py-4 rounded-sm font-raleway font-black text-sm tracking-widest transition-all cursor-pointer ${
            valid ? 'btn-cyber-solid' : 'opacity-25 cursor-not-allowed'
          }`}
          style={!valid ? { border: '1px solid rgba(255,251,213,0.2)', color: 'rgba(255,251,213,0.3)' } : {}}
        >
          {scanMode === 'walkby' ? 'MULAI WALK-BY SCAN →' : 'MULAI BODY SCAN →'}
        </motion.button>
      </motion.div>
    </div>
  );
}
