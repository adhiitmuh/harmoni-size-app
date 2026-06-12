import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.3 + 0.05,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,251,213,${p.alpha})`;
        ctx.fill();
      });

      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(255,251,213,${0.08 * (1 - d / 130)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#034543' }}>
      <canvas ref={canvasRef} className="particle-canvas" />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,251,213,0.05) 0%, transparent 70%)' }} />
      </div>

      {/* Logo ring */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="relative mb-8"
      >
        <div className="w-28 h-28 rounded-full flex items-center justify-center animate-spin-slow"
          style={{ border: '1px solid rgba(255,251,213,0.2)', boxShadow: '0 0 40px rgba(255,251,213,0.08)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ border: '1px solid rgba(255,251,213,0.45)', boxShadow: '0 0 20px rgba(255,251,213,0.1)' }}>
            <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="8" r="4" fill="none" stroke="#FFFBD5" strokeWidth="1.2"/>
              <path d="M12 16 Q10 24 11 32" stroke="#FFFBD5" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
              <path d="M28 16 Q30 24 29 32" stroke="#FFFBD5" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
              <path d="M12 16 Q20 20 28 16" stroke="#FFFBD5" strokeWidth="1.2" fill="none"/>
              <path d="M14 20 Q20 22 26 20" stroke="#FFFBD5" strokeWidth="1.2" fill="none"/>
              <path d="M15 24 Q20 26 25 24 L26 32 L20 30 L14 32 Z" stroke="#FFFBD5" strokeWidth="1.2" fill="none"/>
            </svg>
          </div>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
            style={{ background: '#FFFBD5', boxShadow: '0 0 6px rgba(255,251,213,0.8)' }} />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="text-center mb-3"
      >
        <h1 className="font-raleway font-black text-5xl md:text-6xl tracking-[0.2em] text-glow-cyan"
          style={{ color: '#FFFBD5', letterSpacing: '0.18em' }}>
          harmoni
        </h1>
        <div className="flex items-center gap-3 justify-center mt-3">
          <div className="h-px w-10" style={{ background: 'rgba(255,251,213,0.3)' }} />
          <p className="font-raleway font-medium text-xs tracking-[0.25em] uppercase"
            style={{ color: 'rgba(255,251,213,0.55)' }}>
            AI Body Size Scanner
          </p>
          <div className="h-px w-10" style={{ background: 'rgba(255,251,213,0.3)' }} />
        </div>
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="font-raleway font-light text-sm md:text-base mb-10 text-center max-w-xs"
        style={{ color: 'rgba(255,251,213,0.5)' }}
      >
        Ukur tubuhmu dengan presisi menggunakan AI pose detection
      </motion.p>

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="btn-cyber-solid px-12 py-4 text-sm rounded-sm cursor-pointer tracking-widest"
      >
        MULAI SCAN
      </motion.button>

      {/* Version */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 font-raleway text-xs tracking-widest"
        style={{ color: 'rgba(255,251,213,0.4)' }}
      >
        v1.0 — HARMONI
      </motion.div>

      {/* Corner decorations */}
      {[['top-6 left-6', 'border-t border-l'], ['top-6 right-6', 'border-t border-r'],
        ['bottom-6 left-6', 'border-b border-l'], ['bottom-6 right-6', 'border-b border-r']].map(([pos, b]) => (
        <div key={pos} className={`absolute ${pos} w-5 h-5 ${b} opacity-25`}
          style={{ borderColor: '#FFFBD5' }} />
      ))}
    </div>
  );
}
