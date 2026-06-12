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
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
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
        ctx.fillStyle = `rgba(6,214,245,${p.alpha})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(6,214,245,${0.15 * (1 - d / 120)})`;
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
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="particle-canvas" />

      {/* Radial glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,214,245,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* Logo ring */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative mb-8"
      >
        <div className="w-28 h-28 rounded-full flex items-center justify-center animate-spin-slow"
          style={{ border: '1px solid rgba(6,214,245,0.3)', boxShadow: '0 0 30px rgba(6,214,245,0.15)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ border: '2px solid rgba(6,214,245,0.6)', boxShadow: '0 0 20px rgba(6,214,245,0.3)' }}>
            {/* Body silhouette icon */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="8" r="4" fill="none" stroke="#06d6f5" strokeWidth="1.5"/>
              <path d="M12 16 Q10 24 11 32" stroke="#06d6f5" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M28 16 Q30 24 29 32" stroke="#06d6f5" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M12 16 Q20 20 28 16" stroke="#06d6f5" strokeWidth="1.5" fill="none"/>
              <path d="M14 20 Q20 22 26 20" stroke="#06d6f5" strokeWidth="1.5" fill="none"/>
              <path d="M15 24 Q20 26 25 24 L26 32 L20 30 L14 32 Z" stroke="#06d6f5" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
        </div>
        {/* Orbit dot */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
            style={{ background: '#06d6f5', boxShadow: '0 0 8px #06d6f5' }} />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="text-center mb-3"
      >
        <h1 className="font-orbitron font-black text-5xl md:text-6xl tracking-widest text-glow-cyan"
          style={{ color: '#06d6f5' }}>
          HARMONI
        </h1>
        <div className="flex items-center gap-3 justify-center mt-2">
          <div className="h-px w-12 bg-cyber-cyan opacity-50" />
          <p className="font-mono text-xs tracking-[0.3em] text-sky-300 opacity-80 uppercase">
            AI Body Size Scanner
          </p>
          <div className="h-px w-12 bg-cyber-cyan opacity-50" />
        </div>
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="font-inter text-sky-400 text-sm md:text-base mb-10 text-center max-w-xs opacity-70"
      >
        Precision body measurements using real-time AI pose detection
      </motion.p>

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="btn-cyber-solid px-10 py-4 text-sm font-orbitron tracking-widest rounded-sm cursor-pointer"
        style={{ boxShadow: '0 0 30px rgba(6,214,245,0.25)' }}
      >
        INITIATE SCAN
      </motion.button>

      {/* Version tag */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 font-mono text-xs text-sky-500"
      >
        v1.0.0 — HARMONI SYSTEMS
      </motion.div>

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 opacity-40">
        <div className="w-6 h-6 border-t-2 border-l-2 border-cyber-cyan" />
      </div>
      <div className="absolute top-6 right-6 opacity-40">
        <div className="w-6 h-6 border-t-2 border-r-2 border-cyber-cyan" />
      </div>
      <div className="absolute bottom-6 left-6 opacity-40">
        <div className="w-6 h-6 border-b-2 border-l-2 border-cyber-cyan" />
      </div>
      <div className="absolute bottom-6 right-6 opacity-40">
        <div className="w-6 h-6 border-b-2 border-r-2 border-cyber-cyan" />
      </div>
    </div>
  );
}
