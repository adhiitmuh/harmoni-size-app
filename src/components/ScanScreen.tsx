import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { UserSetup, BodyMeasurements, Keypoint } from '../types';
import { usePoseDetector } from '../hooks/usePoseDetector';
import { calculateMeasurements } from '../utils/measurements';

const CONNECTIONS = [
  [5,6],[5,7],[7,9],[6,8],[8,10],
  [5,11],[6,12],[11,12],
  [11,13],[13,15],[12,14],[14,16],
];

const STATIC_BUFFER = 20;
const STATIC_THRESHOLD = 0.06;
// Walk-by: capture after this many seconds, using best-scored frame
const WALKBY_WINDOW_SEC = 6;

interface PoseScore {
  score: number;
  measurements: BodyMeasurements;
}

interface Props {
  setup: UserSetup;
  onComplete: (m: BodyMeasurements) => void;
  onBack: () => void;
}

type ScanState = 'loading' | 'camera' | 'scanning' | 'stable' | 'walkby-countdown';

export default function ScanScreen({ setup, onComplete, onBack }: Props) {
  const [scanState, setScanState] = useState<ScanState>('loading');
  const [detectedKps, setDetectedKps] = useState(0);
  const [statusMsg, setStatusMsg] = useState('LOADING AI MODEL...');
  const [liveMeasurements, setLiveMeasurements] = useState<BodyMeasurements | null>(null);
  const [poseQuality, setPoseQuality] = useState(0); // 0–1 for walk-by mode
  const [walkbyCountdown, setWalkbyCountdown] = useState(WALKBY_WINDOW_SEC);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const isDetecting = useRef(false);
  const measureBuffer = useRef<BodyMeasurements[]>([]);
  const bestWalkbyFrame = useRef<PoseScore | null>(null);
  const walkbyStartTime = useRef<number>(0);
  const walkbyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameCount = useRef(0);
  const scanLineRef = useRef(0);
  const scanStarted = useRef(false);

  const { detector, isLoading: modelLoading, loadingStage } = usePoseDetector();
  const isWalkby = setup.scanMode === 'walkby';

  const calcPoseQualityScore = useCallback((kps: Keypoint[], canvas: HTMLCanvasElement): number => {
    const MIN_SCORE = 0.25;
    const confidentCount = kps.filter(k => (k.score ?? 0) >= MIN_SCORE).length;
    const avgConf = kps.reduce((s, k) => s + (k.score ?? 0), 0) / kps.length;

    // Facing score: both shoulders & hips visible and roughly same Y level
    const ls = kps[5], rs = kps[6], lh = kps[11], rh = kps[12];
    const hasShoulders = (ls?.score ?? 0) >= MIN_SCORE && (rs?.score ?? 0) >= MIN_SCORE;
    const hasHips = (lh?.score ?? 0) >= MIN_SCORE && (rh?.score ?? 0) >= MIN_SCORE;
    const shoulderLevelDiff = hasShoulders ? Math.abs(ls.y - rs.y) / canvas.height : 1;
    const facingScore = hasShoulders && hasHips ? Math.max(0, 1 - shoulderLevelDiff * 5) : 0;

    // Coverage: body height fraction of canvas
    const nose = kps[0];
    const ankleY = (kps[15]?.score ?? 0) >= MIN_SCORE ? kps[15].y :
                   (kps[16]?.score ?? 0) >= MIN_SCORE ? kps[16].y : 0;
    const coverageScore = nose && ankleY > 0
      ? Math.min(1, (ankleY - nose.y) / (canvas.height * 0.7))
      : 0;

    return (confidentCount / 17) * 0.3 + avgConf * 0.2 + facingScore * 0.3 + coverageScore * 0.2;
  }, []);

  // Camera setup
  useEffect(() => {
    let cancelled = false;
    const startCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setScanState('scanning');
        setStatusMsg(isWalkby ? 'JALAN PELAN MELEWATI KAMERA' : 'STAND BACK 2–3M · ALIGN FULL BODY');
      } catch {
        setStatusMsg('CAMERA ACCESS DENIED');
      }
    };

    if (!modelLoading && detector) {
      setScanState('camera');
      startCam();
    } else {
      setStatusMsg(loadingStage);
    }

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (walkbyTimerRef.current) clearInterval(walkbyTimerRef.current);
    };
  }, [modelLoading, detector, loadingStage, isWalkby]);

  const isStable = useCallback((buf: BodyMeasurements[]): boolean => {
    if (buf.length < STATIC_BUFFER) return false;
    const keys: (keyof BodyMeasurements)[] = ['chest', 'waist', 'hips', 'shoulderWidth'];
    return keys.every(k => {
      const vals = buf.map(m => m[k] as number);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return avg > 0 && Math.max(...vals.map(v => Math.abs(v - avg))) / avg < STATIC_THRESHOLD;
    });
  }, []);

  // Walk-by countdown timer
  const startWalkbyTimer = useCallback(() => {
    if (scanStarted.current) return;
    scanStarted.current = true;
    walkbyStartTime.current = Date.now();
    setWalkbyCountdown(WALKBY_WINDOW_SEC);
    setScanState('walkby-countdown');

    walkbyTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - walkbyStartTime.current) / 1000;
      const remaining = Math.max(0, WALKBY_WINDOW_SEC - elapsed);
      setWalkbyCountdown(Math.ceil(remaining));

      if (remaining <= 0) {
        clearInterval(walkbyTimerRef.current!);
        const best = bestWalkbyFrame.current;
        if (best) onComplete(best.measurements);
      }
    }, 250);
  }, [onComplete]);

  const drawFrame = useCallback(async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -W, 0, W, H);
    ctx.restore();

    ctx.fillStyle = 'rgba(3,69,67,0.3)';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,251,213,0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Corner brackets
    const drawCorner = (x: number, y: number, dx: number, dy: number, color = '#FFFBD5') => {
      ctx.beginPath();
      ctx.moveTo(x + dx * 28, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * 28);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    const bracketColor = isWalkby ? '#d4b483' : '#FFFBD5';
    drawCorner(24, 24, 1, 1, bracketColor);
    drawCorner(W-24, 24, -1, 1, bracketColor);
    drawCorner(24, H-24, 1, -1, bracketColor);
    drawCorner(W-24, H-24, -1, -1, bracketColor);

    // Walk-by: animated side scan bars instead of horizontal scan line
    if (isWalkby) {
      scanLineRef.current = (scanLineRef.current + 1.5) % W;
      const sl = scanLineRef.current;
      const vGrad = ctx.createLinearGradient(sl, 0, sl, H);
      vGrad.addColorStop(0, 'transparent');
      vGrad.addColorStop(0.3, 'rgba(212,180,131,0.6)');
      vGrad.addColorStop(0.5, 'rgba(212,180,131,0.9)');
      vGrad.addColorStop(0.7, 'rgba(212,180,131,0.6)');
      vGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = vGrad;
      ctx.fillRect(sl, 0, 2, H);
      // Trail
      const trailH = ctx.createLinearGradient(sl, 0, sl + 50, 0);
      trailH.addColorStop(0, 'rgba(212,180,131,0.05)');
      trailH.addColorStop(1, 'transparent');
      ctx.fillStyle = trailH;
      ctx.fillRect(sl, 0, 50, H);
    } else {
      // Static: horizontal scan line
      scanLineRef.current = (scanLineRef.current + 2) % H;
      const sl = scanLineRef.current;
      const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
      lineGrad.addColorStop(0, 'transparent');
      lineGrad.addColorStop(0.3, 'rgba(255,251,213,0.7)');
      lineGrad.addColorStop(0.5, 'rgba(212,180,131,0.9)');
      lineGrad.addColorStop(0.7, 'rgba(255,251,213,0.7)');
      lineGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = lineGrad;
      ctx.fillRect(0, sl, W, 1);
      const trailGrad = ctx.createLinearGradient(0, sl, 0, sl + 60);
      trailGrad.addColorStop(0, 'rgba(255,251,213,0.05)');
      trailGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = trailGrad;
      ctx.fillRect(0, sl, W, 60);
    }

    frameCount.current++;
    if (detector && !isDetecting.current && frameCount.current % 2 === 0) {
      isDetecting.current = true;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const poses = await (detector as any).estimatePoses(video);
        isDetecting.current = false;

        if (poses?.[0]) {
          const pose = poses[0];
          const scaleX = W / video.videoWidth;
          const scaleY = H / video.videoHeight;

          const kpsDisplay: Keypoint[] = pose.keypoints.map((kp: Keypoint) => ({
            ...kp, x: W - kp.x * scaleX, y: kp.y * scaleY,
          }));
          const kpsCalc: Keypoint[] = pose.keypoints.map((kp: Keypoint) => ({
            ...kp, x: kp.x * scaleX, y: kp.y * scaleY,
          }));

          const confidentKps = kpsDisplay.filter(k => (k.score ?? 0) >= 0.25).length;
          if (frameCount.current % 5 === 0) setDetectedKps(confidentKps);

          // Draw skeleton
          CONNECTIONS.forEach(([a, b]) => {
            const ka = kpsDisplay[a], kb = kpsDisplay[b];
            if ((ka?.score ?? 0) < 0.25 || (kb?.score ?? 0) < 0.25) return;
            ctx.beginPath();
            ctx.moveTo(ka.x, ka.y);
            ctx.lineTo(kb.x, kb.y);
            ctx.strokeStyle = isWalkby ? 'rgba(212,180,131,0.75)' : 'rgba(255,251,213,0.75)';
            ctx.lineWidth = 2;
            ctx.shadowColor = isWalkby ? '#d4b483' : '#FFFBD5';
            ctx.shadowBlur = 6;
            ctx.stroke();
            ctx.shadowBlur = 0;
          });

          // Draw keypoints
          kpsDisplay.forEach(kp => {
            if ((kp.score ?? 0) < 0.25) return;
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#88c98b';
            ctx.shadowColor = '#88c98b';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          });

          const m = calculateMeasurements(kpsCalc, setup.heightCm, setup.gender);
          if (m) {
            if (frameCount.current % 6 === 0) setLiveMeasurements(m);

            // Animated measurement threads
            const threadProgress = isWalkby
              ? 1
              : Math.min(measureBuffer.current.length / STATIC_BUFFER, 1);
            const tOffset = (frameCount.current * 1.5) % 18;
            const isStableNow = scanState === 'stable';

            const ls = kpsDisplay[5], rs = kpsDisplay[6];
            const lh = kpsDisplay[11], rh = kpsDisplay[12];
            const hasShoulders = (ls?.score ?? 0) >= 0.25 && (rs?.score ?? 0) >= 0.25;
            const hasHips = (lh?.score ?? 0) >= 0.25 && (rh?.score ?? 0) >= 0.25;

            if (hasShoulders && threadProgress > 0.05) {
              const rgbThread = isStableNow ? '136,201,139' : '255,251,213';

              const drawMeasureThread = (
                x1: number, y1: number, x2: number, y2: number,
                label: string, value: string, baseAlpha: number
              ) => {
                const extend = 26;
                const dx = x2 - x1, dy = y2 - y1;
                const len = Math.sqrt(dx*dx + dy*dy) || 1;
                const ux = dx/len, uy = dy/len;
                const sx = x1 - ux*extend, sy = y1 - uy*extend;
                const ex = x2 + ux*extend, ey = y2 + uy*extend;
                const totalLen = len + extend*2;
                const drawLen = totalLen * threadProgress;

                ctx.save();
                ctx.setLineDash([5, 5]);
                ctx.lineDashOffset = -tOffset;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx + ux * drawLen, sy + uy * drawLen);
                ctx.strokeStyle = `rgba(${rgbThread},${baseAlpha * 0.6})`;
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();

                // Left dot
                ctx.beginPath();
                ctx.arc(sx, sy, 2.5, 0, Math.PI*2);
                ctx.fillStyle = `rgba(${rgbThread},${baseAlpha * 0.75})`;
                ctx.fill();

                // Right dot + label (fades in as thread completes)
                if (threadProgress >= 0.8) {
                  const fadeIn = Math.min((threadProgress - 0.8) / 0.2, 1);
                  ctx.beginPath();
                  ctx.arc(ex, ey, 2.5, 0, Math.PI*2);
                  ctx.fillStyle = `rgba(${rgbThread},${baseAlpha * fadeIn * 0.8})`;
                  ctx.fill();
                  ctx.font = '500 9px sans-serif';
                  ctx.fillStyle = `rgba(${rgbThread},${baseAlpha * fadeIn * 0.5})`;
                  ctx.fillText(label, ex + 7, ey);
                  ctx.font = 'bold 11px sans-serif';
                  ctx.fillStyle = `rgba(${rgbThread},${baseAlpha * fadeIn})`;
                  ctx.fillText(value, ex + 7, ey + 11);
                }
              };

              // Shoulder
              drawMeasureThread(ls.x, ls.y, rs.x, rs.y, 'BAHU', `${m.shoulderWidth}cm`, 0.9);

              if (hasHips) {
                const t1 = 0.28;
                drawMeasureThread(
                  ls.x + (lh.x - ls.x)*t1, ls.y + (lh.y - ls.y)*t1,
                  rs.x + (rh.x - rs.x)*t1, rs.y + (rh.y - rs.y)*t1,
                  'DADA', `${m.chest}cm`, 0.85
                );
                const t2 = 0.62;
                drawMeasureThread(
                  ls.x + (lh.x - ls.x)*t2, ls.y + (lh.y - ls.y)*t2,
                  rs.x + (rh.x - rs.x)*t2, rs.y + (rh.y - rs.y)*t2,
                  'PINGGANG', `${m.waist}cm`, 0.85
                );
                drawMeasureThread(lh.x, lh.y, rh.x, rh.y, 'PINGGUL', `${m.hips}cm`, 0.9);
              }
            }

            if (isWalkby) {
              const quality = calcPoseQualityScore(kpsDisplay, canvas);
              if (frameCount.current % 4 === 0) setPoseQuality(quality);

              // Start timer on first good detection
              if (quality > 0.35) startWalkbyTimer();

              // Track best frame
              if (!bestWalkbyFrame.current || quality > bestWalkbyFrame.current.score) {
                bestWalkbyFrame.current = { score: quality, measurements: m };
              }

              // Draw quality score ring on body center
              const shoulderMidX = ((kpsDisplay[5]?.x ?? 0) + (kpsDisplay[6]?.x ?? 0)) / 2;
              const shoulderMidY = ((kpsDisplay[5]?.y ?? 0) + (kpsDisplay[6]?.y ?? 0)) / 2;
              const angle = quality * Math.PI * 2 - Math.PI / 2;
              ctx.beginPath();
              ctx.arc(shoulderMidX, shoulderMidY, 20, -Math.PI / 2, angle);
              ctx.strokeStyle = quality > 0.7 ? '#88c98b' : '#d4b483';
              ctx.lineWidth = 3;
              ctx.shadowColor = quality > 0.7 ? '#88c98b' : '#d4b483';
              ctx.shadowBlur = 10;
              ctx.stroke();
              ctx.shadowBlur = 0;

            } else {
              // Static mode
              measureBuffer.current = [...measureBuffer.current.slice(-(STATIC_BUFFER - 1)), m];
              if (isStable(measureBuffer.current)) {
                setScanState('stable');
                setStatusMsg('UKURAN STABIL — SIAP DIAMBIL');
              } else if (scanState === 'scanning') {
                const pct = Math.round((measureBuffer.current.length / STATIC_BUFFER) * 100);
                setStatusMsg(`MENGUKUR... ${pct}%`);
              }
            }
          } else {
            measureBuffer.current = [];
            if (!isWalkby && scanState === 'scanning') setStatusMsg('POSISIKAN SELURUH TUBUH DI FRAME');
          }
        } else {
          if (frameCount.current % 5 === 0) setDetectedKps(0);
          measureBuffer.current = [];
        }
      } catch {
        isDetecting.current = false;
      }
    }

    rafRef.current = requestAnimationFrame(drawFrame);
  }, [detector, setup.heightCm, isWalkby, isStable, scanState, calcPoseQualityScore, startWalkbyTimer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    if (scanState === 'scanning' || scanState === 'stable' || scanState === 'walkby-countdown') {
      rafRef.current = requestAnimationFrame(drawFrame);
    }
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [scanState, drawFrame]);

  const handleCapture = () => {
    if (isWalkby) {
      const best = bestWalkbyFrame.current ?? (liveMeasurements ? { measurements: liveMeasurements, score: 0 } : null);
      if (best) onComplete(best.measurements);
    } else {
      const m = liveMeasurements;
      if (m) onComplete(m);
    }
  };

  const accentColor = isWalkby ? '#d4b483' : '#FFFBD5';
  const stableColor = scanState === 'stable' ? '#88c98b' : accentColor;

  const canCapture = isWalkby
    ? (bestWalkbyFrame.current !== null || liveMeasurements !== null)
    : (liveMeasurements !== null);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Loading overlay */}
      <AnimatePresence>
        {scanState === 'loading' && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: 'rgba(3,69,67,0.97)' }}>
            <div className="w-16 h-16 rounded-full mb-6 animate-spin"
              style={{ border: '2px solid transparent', borderTopColor: '#FFFBD5', borderRightColor: '#d4b483' }} />
            <p className="font-raleway font-semibold text-xs tracking-widest" style={{ color: 'rgba(255,251,213,0.7)' }}>{loadingStage}</p>
            <div className="mt-4 w-48 h-0.5 rounded overflow-hidden" style={{ background: 'rgba(255,251,213,0.1)' }}>
              <div className="h-full loading-bar w-1/2" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Walk-by mode label */}
      {isWalkby && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-sm font-raleway font-bold text-xs tracking-wider"
          style={{ border: '1px solid rgba(212,180,131,0.5)', color: '#d4b483', background: 'rgba(212,180,131,0.08)' }}>
          WALK-BY MODE
        </div>
      )}

      <button onClick={onBack}
        className="absolute top-4 left-4 z-10 flex items-center gap-1.5 font-raleway font-semibold text-xs opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
        style={{ color: '#FFFBD5' }}>
        <ChevronLeft size={14} /> KEMBALI
      </button>

      <div className="absolute top-4 right-4 z-10 font-raleway font-medium text-xs"
        style={{ color: 'rgba(255,251,213,0.4)' }}>LANGKAH 02 / 02</div>

      {/* Walk-by countdown ring */}
      <AnimatePresence>
        {scanState === 'walkby-countdown' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-1/2 right-6 -translate-y-1/2 z-10 flex flex-col items-center"
          >
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(212,180,131,0.15)" strokeWidth="3" />
                <circle cx="28" cy="28" r="24" fill="none" stroke="#d4b483" strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (walkbyCountdown / WALKBY_WINDOW_SEC)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.25s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-raleway font-black text-base"
                style={{ color: '#d4b483' }}>
                {walkbyCountdown}
              </div>
            </div>
            <p className="font-raleway text-[9px] mt-1 tracking-wider" style={{ color: '#d4b483' }}>AUTO</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pose quality bar (walk-by) */}
      {isWalkby && poseQuality > 0 && (
        <div className="absolute top-16 right-4 z-10 flex flex-col items-end gap-1">
          <span className="font-raleway font-semibold text-[10px] tracking-wider"
            style={{ color: 'rgba(212,180,131,0.7)' }}>
            POSE QUALITY
          </span>
          <div className="w-24 h-1.5 rounded overflow-hidden" style={{ background: 'rgba(212,180,131,0.15)' }}>
            <motion.div
              animate={{ width: `${poseQuality * 100}%` }}
              className="h-full rounded"
              style={{ background: poseQuality > 0.7 ? '#88c98b' : '#d4b483' }}
            />
          </div>
          <span className="font-raleway text-[10px]"
            style={{ color: poseQuality > 0.7 ? '#88c98b' : '#d4b483' }}>
            {Math.round(poseQuality * 100)}%
          </span>
        </div>
      )}

      {/* Live measurements HUD */}
      <AnimatePresence>
        {liveMeasurements && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="absolute top-16 left-4 z-10 space-y-1">
            {([['DADA', liveMeasurements.chest], ['PINGGANG', liveMeasurements.waist],
               ['PINGGUL', liveMeasurements.hips], ['BAHU', liveMeasurements.shoulderWidth]] as [string,number][]).map(([l, v]) => (
              <div key={l} className="flex items-center gap-2 font-raleway font-medium text-xs">
                <span className="text-[10px] tracking-wider w-16" style={{ color: 'rgba(255,251,213,0.45)' }}>{l}</span>
                <span style={{ color: stableColor }}>{v}</span>
                <span className="text-[10px]" style={{ color: 'rgba(255,251,213,0.35)' }}>cm</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keypoint count */}
      {detectedKps > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 font-raleway font-medium text-xs"
          style={{ color: 'rgba(255,251,213,0.45)' }}>
          {detectedKps}/17 titik
        </div>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4"
        style={{ background: 'linear-gradient(transparent, rgba(3,69,67,0.96))' }}>
        <div className="flex items-center gap-2 mb-3">
          {scanState === 'stable'
            ? <CheckCircle2 size={14} style={{ color: '#88c98b' }} />
            : <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: accentColor }} />
          }
          <span className="font-raleway font-semibold text-xs tracking-wider" style={{ color: stableColor }}>
            {statusMsg}
          </span>
        </div>

        {/* Static: progress bar */}
        {!isWalkby && scanState === 'scanning' && measureBuffer.current.length > 0 && (
          <div className="mb-3 h-0.5 rounded overflow-hidden" style={{ background: 'rgba(255,251,213,0.1)' }}>
            <motion.div className="h-full rounded"
              style={{ background: 'linear-gradient(90deg, #FFFBD5, #d4b483)', width: `${(measureBuffer.current.length / STATIC_BUFFER) * 100}%` }}
            />
          </div>
        )}

        {/* Walk-by: best score so far */}
        {isWalkby && bestWalkbyFrame.current && (
          <div className="mb-3 font-raleway text-xs" style={{ color: 'rgba(255,251,213,0.4)' }}>
            Kualitas terbaik: <span style={{ color: '#d4b483' }}>{Math.round(bestWalkbyFrame.current.score * 100)}%</span>
          </div>
        )}

        <motion.button
          whileHover={canCapture ? { scale: 1.02 } : {}}
          whileTap={canCapture ? { scale: 0.98 } : {}}
          onClick={handleCapture}
          disabled={!canCapture}
          className="w-full py-3.5 rounded-sm font-raleway font-black text-sm tracking-widest transition-all cursor-pointer"
          style={scanState === 'stable'
            ? { background: '#FFFBD5', color: '#034543', boxShadow: '0 4px 20px rgba(255,251,213,0.2)' }
            : canCapture
              ? { border: `1px solid ${accentColor}`, color: accentColor, background: 'rgba(255,251,213,0.04)' }
              : { border: '1px solid rgba(255,251,213,0.15)', color: 'rgba(255,251,213,0.3)', cursor: 'not-allowed' }
          }
        >
          {scanState === 'stable' ? 'AMBIL UKURAN'
            : isWalkby && canCapture ? 'AMBIL FRAME TERBAIK'
            : !canCapture ? 'MENDETEKSI TUBUH...'
            : 'STABILISASI...'}
        </motion.button>
      </div>

      {/* Stable flash */}
      <AnimatePresence>
        {scanState === 'stable' && (
          <motion.div initial={{ opacity: 0.3 }} animate={{ opacity: 0 }} transition={{ duration: 1.2 }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,251,213,0.08), transparent 70%)' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
