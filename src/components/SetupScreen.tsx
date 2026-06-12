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
    { id: 'male', label: 'MALE', icon: <User size={14} /> },
    { id: 'female', label: 'FEMALE', icon: <User size={14} /> },
    { id: 'unisex', label: 'UNISEX', icon: <Users size={14} /> },
  ];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-6 overflow-y-auto py-10">
      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-1.5 font-mono text-xs text-sky-400 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <ChevronLeft size={14} /> BACK
      </button>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <p className="font-mono text-xs tracking-[0.3em] text-sky-500 mb-2">STEP 01 / 02</p>
        <h2 className="font-orbitron text-2xl text-white tracking-wider">BODY PARAMETERS</h2>
        <div className="h-px mt-3 mx-auto w-32"
          style={{ background: 'linear-gradient(90deg, transparent, #06d6f5, transparent)' }} />
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
            <label className="font-mono text-xs text-sky-400 tracking-widest">HEIGHT</label>
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
                  className={`font-mono text-xs px-2 py-0.5 rounded-sm transition-all cursor-pointer ${
                    unit === u ? '' : 'text-sky-500 border border-sky-700 hover:border-sky-400'
                  }`}
                  style={unit === u ? { backgroundColor: '#06d6f5', color: '#030712' } : {}}
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
              className="input-cyber w-full px-4 py-3 rounded-sm text-2xl font-orbitron tracking-wider"
            />
            <span className="font-mono text-sky-500 text-sm">{unit}</span>
          </div>
          {!valid && height !== '' && (
            <p className="font-mono text-xs mt-2" style={{ color: '#f54b4b' }}>
              Enter a valid height (100–250 cm)
            </p>
          )}
          <p className="font-mono text-xs text-sky-600 mt-2">≈ {heightCm} cm · for scale calibration</p>
        </div>

        {/* Gender selection */}
        <div className="holo-panel rounded-sm p-5 corner-bracket">
          <label className="font-mono text-xs text-sky-400 tracking-widest block mb-3">BODY TYPE / SIZE CHART</label>
          <div className="grid grid-cols-3 gap-2">
            {genderOptions.map(opt => (
              <button key={opt.id} onClick={() => setGender(opt.id)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-sm font-orbitron text-xs tracking-wider transition-all cursor-pointer ${
                  gender === opt.id ? 'glow-cyan' : 'opacity-50 hover:opacity-80'
                }`}
                style={gender === opt.id
                  ? { border: '1px solid #06d6f5', color: '#06d6f5', background: 'rgba(6,214,245,0.08)' }
                  : { border: '1px solid rgba(6,214,245,0.2)', color: '#7dd3fc' }
                }
              >
                {opt.icon}{opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scan mode toggle */}
        <div className="holo-panel rounded-sm p-5" style={{ borderColor: 'rgba(139,92,246,0.4)' }}>
          <label className="font-mono text-xs tracking-widest block mb-3" style={{ color: '#a78bfa' }}>
            SCAN MODE
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* Static mode */}
            <button
              onClick={() => setScanMode('static')}
              className={`flex flex-col items-center gap-2 py-4 px-3 rounded-sm transition-all cursor-pointer text-left`}
              style={scanMode === 'static'
                ? { border: '1px solid #06d6f5', background: 'rgba(6,214,245,0.08)' }
                : { border: '1px solid rgba(139,92,246,0.25)', opacity: 0.55 }
              }
            >
              <PersonStanding size={22} style={{ color: scanMode === 'static' ? '#06d6f5' : '#a78bfa' }} />
              <div>
                <p className="font-orbitron text-xs tracking-wider text-center"
                  style={{ color: scanMode === 'static' ? '#06d6f5' : '#c4b5fd' }}>
                  STATIC
                </p>
                <p className="font-mono text-[10px] text-sky-600 text-center mt-0.5">Berdiri diam</p>
              </div>
              {scanMode === 'static' && (
                <div className="text-[9px] font-mono text-center" style={{ color: 'rgba(6,214,245,0.6)' }}>
                  20 frame · presisi tinggi
                </div>
              )}
            </button>

            {/* Walk-by mode */}
            <button
              onClick={() => setScanMode('walkby')}
              className={`flex flex-col items-center gap-2 py-4 px-3 rounded-sm transition-all cursor-pointer`}
              style={scanMode === 'walkby'
                ? { border: '1px solid #f5a623', background: 'rgba(245,166,35,0.08)' }
                : { border: '1px solid rgba(139,92,246,0.25)', opacity: 0.55 }
              }
            >
              <Footprints size={22} style={{ color: scanMode === 'walkby' ? '#f5a623' : '#a78bfa' }} />
              <div>
                <p className="font-orbitron text-xs tracking-wider text-center"
                  style={{ color: scanMode === 'walkby' ? '#f5a623' : '#c4b5fd' }}>
                  WALK-BY
                </p>
                <p className="font-mono text-[10px] text-sky-600 text-center mt-0.5">Jalan lewat kamera</p>
              </div>
              {scanMode === 'walkby' && (
                <div className="text-[9px] font-mono text-center" style={{ color: 'rgba(245,166,35,0.6)' }}>
                  Auto-capture best frame
                </div>
              )}
            </button>
          </div>

          <p className="font-mono text-[10px] text-sky-700 mt-3 leading-relaxed">
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
          className={`w-full py-4 rounded-sm font-orbitron text-sm tracking-widest transition-all cursor-pointer ${
            valid ? 'btn-cyber-solid' : 'opacity-30 cursor-not-allowed border border-sky-800 text-sky-700'
          }`}
        >
          {scanMode === 'walkby' ? 'START WALK-BY SCAN →' : 'START BODY SCAN →'}
        </motion.button>
      </motion.div>
    </div>
  );
}
