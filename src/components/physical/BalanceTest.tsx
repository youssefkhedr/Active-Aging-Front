import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Gauge, Trophy, AlertCircle, Timer, Eye, EyeOff } from 'lucide-react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import { savePhysicalResult } from '../../utils/storage';
import { assessmentService } from '../../services/assessment.service';

interface BalanceTestProps {
  onBack: () => void;
}

type Phase = 'select' | 'intro' | 'ready' | 'testing' | 'result';
type BalanceStage = 1 | 2 | 3 | 4 | null;

const STAGES = [
  { id: 1, title: 'المستوى 1: توازن ساكن بسيط', titleEn: 'Level 1 - Basic Static Balance', positionAr: 'القدمين معاً', positionEn: 'Feet together', eyes: 'open', duration: 30, color: 'bg-green-400' },
  { id: 2, title: 'المستوى 2: الوقوف على قدم واحدة', titleEn: 'Level 2 - Single-Leg Stance', positionAr: 'الوقوف على القدم المهيمنة', positionEn: 'Single-leg stance', eyes: 'open', duration: 30, color: 'bg-blue-400' },
  { id: 3, title: 'المستوى 3: تحدي الحواس', titleEn: 'Level 3 - Sensory Challenge', positionAr: 'الوقوف على قدم واحدة', positionEn: 'Single-leg stance', eyes: 'closed', duration: 20, color: 'bg-indigo-400' },
  { id: 4, title: 'المستوى 4: قاعدة دعم مصغرة', titleEn: 'Level 4 - Reduced Base of Support', positionAr: 'وقوف ترادفي (كعب لأصابع)', positionEn: 'Tandem stance (heel-to-toe)', eyes: 'open', duration: 30, color: 'bg-amber-400' },
];

export function BalanceTest({ onBack }: BalanceTestProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [balanceStage, setBalanceStage] = useState<BalanceStage>(null);
  const [countdown, setCountdown] = useState(5);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [swayData, setSwayData] = useState<number[]>([]);
  const [stabilityScore, setStabilityScore] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const smoothedCOMRef = useRef<{ x: number, y: number } | null>(null);
  const comHistoryRef = useRef<{ x: number, y: number }[]>([]);
  const currentSwayRef = useRef(0);
  const lastFrameTimeRef = useRef(0);

  const FPS_LIMIT = 12;
  const FRAME_INTERVAL = 1000 / FPS_LIMIT;
  const SMOOTHING_ALPHA = 0.15; // Increased slightly for responsiveness
  const VISIBILITY_THRESHOLD = 0.6;
  const NOISE_THRESHOLD = 0.002; // Reduced threshold to allow more natural sway detection

  const currentStageInfo = STAGES.find(s => s.id === balanceStage);

  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } });
      if (videoRef.current) { videoRef.current.srcObject = stream; streamRef.current = stream; setCameraActive(true); }
    } catch (e) { console.error(e); }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    setCameraActive(false);
  }, []);

  useEffect(() => {
    const loadModel = async () => {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
      poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`, delegate: "GPU" },
        runningMode: "VIDEO", numPoses: 1
      });
    };
    loadModel();
  }, []);

  useEffect(() => {
    if (phase !== 'select' && phase !== 'result') initializeCamera();
    else stopCamera();
    return () => stopCamera();
  }, [phase]);

  useEffect(() => {
    if (phase === 'ready' && countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    } else if (phase === 'ready' && countdown === 0) {
      setPhase('testing');
      setTimeRemaining(currentStageInfo?.duration || 30);
    }
  }, [phase, countdown, currentStageInfo]);

  useEffect(() => {
    if (phase === 'testing' && timeRemaining > 0) {
      const t = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) { clearInterval(t); finishTest(); return 0; }
          return prev - 1;
        });
        setSwayData(prev => [...prev, currentSwayRef.current]);
      }, 1000);
      return () => clearInterval(t);
    }
  }, [phase, timeRemaining]);

  useEffect(() => {
    let animationFrameId: number;
    const predict = async () => {
      if (!poseLandmarkerRef.current || !videoRef.current || !canvasRef.current) {
        if (cameraActive) animationFrameId = requestAnimationFrame(predict);
        return;
      }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.readyState !== 4) { animationFrameId = requestAnimationFrame(predict); return; }
      if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
        canvas.width = video.clientWidth; canvas.height = video.clientHeight;
      }
      const startTimeMs = performance.now();
      if (startTimeMs - lastFrameTimeRef.current < FRAME_INTERVAL) {
        animationFrameId = requestAnimationFrame(predict); return;
      }
      lastFrameTimeRef.current = startTimeMs;
      poseLandmarkerRef.current.detectForVideo(video, startTimeMs, (result) => {
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const du = new DrawingUtils(ctx);
        for (const landmark of result.landmarks) {
          du.drawLandmarks(landmark, { radius: 2, color: '#FF0000', lineWidth: 1 });
          du.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, { color: '#007f8b', lineWidth: 3 });

          // Check visibility of shoulders and hips (11, 12, 23, 24)
          const visible = [11, 12, 23, 24].every(idx => (landmark[idx].visibility || 0) > VISIBILITY_THRESHOLD);

          if (!visible) continue; // Skip frame if key landmarks are not visible

          const rawX = (landmark[11].x + landmark[12].x + landmark[23].x + landmark[24].x) / 4;
          const rawY = (landmark[11].y + landmark[12].y + landmark[23].y + landmark[24].y) / 4;
          let curX = rawX, curY = rawY;

          if (smoothedCOMRef.current) {
            const dist = Math.sqrt(Math.pow(rawX - smoothedCOMRef.current.x, 2) + Math.pow(rawY - smoothedCOMRef.current.y, 2));
            // Apply stronger smoothing if movement is very small (jitter/noise reduction)
            const alpha = dist < NOISE_THRESHOLD ? 0.02 : SMOOTHING_ALPHA;
            curX = smoothedCOMRef.current.x + alpha * (rawX - smoothedCOMRef.current.x);
            curY = smoothedCOMRef.current.y + alpha * (rawY - smoothedCOMRef.current.y);
          }
          smoothedCOMRef.current = { x: curX, y: curY };
          if (phase === 'testing') {
            comHistoryRef.current.push({ x: curX, y: curY });
            if (comHistoryRef.current.length > 50) comHistoryRef.current.shift();
            const mX = comHistoryRef.current.reduce((a, p) => a + p.x, 0) / comHistoryRef.current.length;
            const mY = comHistoryRef.current.reduce((a, p) => a + p.y, 0) / comHistoryRef.current.length;
            const dev = Math.sqrt(Math.pow(curX - mX, 2) + Math.pow(curY - mY, 2));
            // Increased sensitivity multiplier from 400 to 800 to make the test harder/more accurate
            currentSwayRef.current = Math.min(100, dev * 800);
            ctx.beginPath(); ctx.arc(mX * canvas.width, mY * canvas.height, 5, 0, 2 * Math.PI); ctx.fillStyle = 'blue'; ctx.fill();
          }
          ctx.beginPath(); ctx.arc(curX * canvas.width, curY * canvas.height, 10, 0, 2 * Math.PI); ctx.fillStyle = '#00FF00'; ctx.fill();
        }
      });
      if (cameraActive) animationFrameId = requestAnimationFrame(predict);
    };
    if (cameraActive) predict(); return () => cancelAnimationFrame(animationFrameId);
  }, [cameraActive, phase]);

  const finishTest = async () => {
    const avgSway = swayData.length ? swayData.reduce((a, b) => a + b, 0) / swayData.length : 0;
    const score = Math.max(0, Math.min(100, 100 - (avgSway * 5)));
    setStabilityScore(Math.round(score));
    savePhysicalResult({ assessmentType: 'balance', value: score, metrics: { avgSway, duration: currentStageInfo?.duration || 30 }, timestamp: Date.now() });
    try { await assessmentService.createBalance({ swayScore: avgSway, stabilityIndex: score, testType: `Static - Level ${balanceStage}` }); } catch (e) { console.error(e); }
    setPhase('result');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {phase !== 'select' && phase !== 'result' && (
          <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 text-right">
              <div className={`w-10 h-10 ${currentStageInfo?.color} rounded-full flex items-center justify-center text-white`}>
                <Gauge className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{currentStageInfo?.title}</h2>
            </div>
            <button onClick={() => setPhase('select')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white shadow-sm">
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
          </div>
        )}

        {phase === 'select' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={onBack} className="p-3 bg-white rounded-xl shadow-lg border border-slate-100 transition-all hover:bg-slate-50"><ArrowLeft className="w-6 h-6 text-slate-700" /></button>
              <div><h1 className="text-3xl font-black text-slate-800">تقييم التوازن</h1><p className="text-slate-500 font-bold">إختر المستوى لبدء الاختبار</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setBalanceStage(s.id as any); setPhase('intro'); }}
                  className={`relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br ${s.color.replace('bg-', 'from-').replace('-400', '-500 to-gray-600')} text-white shadow-xl transform transition-all duration-300 hover:scale-105 text-right`}
                >
                  <div className="absolute top-4 left-4 bg-white/20 p-2 rounded-full"><Gauge className="w-8 h-8" /></div>
                  <div className="text-4xl font-black mb-2 opacity-50">{s.id}</div>
                  <h3 className="text-xl font-bold mb-4">{s.title}</h3>
                  <div className="space-y-1 text-sm bg-black/10 p-4 rounded-xl">
                    <p>🔹 الوضعية: {s.positionAr}</p>
                    <p>🔹 العينان: {s.eyes === 'open' ? 'مفتوحة' : 'مغلقة'}</p>
                    <p>🔹 المدة: {s.duration} ثانية</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'intro' && (
          <div className="max-w-2xl mx-auto w-full">
            <div className="bg-white rounded-3xl shadow-2xl p-10 border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className={`p-4 rounded-2xl ${currentStageInfo?.color} text-white`}><Gauge className="w-10 h-10" /></div>
                <h1 className="text-3xl font-black text-slate-800">{currentStageInfo?.title}</h1>
              </div>
              <div className="space-y-6 mb-10 text-right">
                <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100">
                  <h3 className="font-bold text-blue-800 mb-2">تعليمات المستوى:</h3>
                  <p className="text-gray-700 text-lg">تحرك للوضعية: <strong>{currentStageInfo?.positionAr}</strong></p>
                  <div className="mt-4 flex items-center justify-end gap-3">
                    <span className="font-bold">العينان: {currentStageInfo?.eyes === 'open' ? 'مفتوحة' : 'مغلقة'}</span>
                    {currentStageInfo?.eyes === 'open' ? <Eye className="text-green-600" /> : <EyeOff className="text-red-600" />}
                  </div>
                </div>
                <div className="bg-amber-50 p-6 rounded-2xl flex gap-4 items-start border-2 border-amber-100">
                  <p className="text-amber-800 text-sm font-bold leading-relaxed">سيقوم التطبيق بالاعتداد بوضعيتك لمدة {currentStageInfo?.duration} ثوانٍ. حافظ على ثبات النقطة الخضراء في المنتصف.</p>
                  <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                </div>
              </div>
              <button onClick={() => { setPhase('ready'); setCountdown(5); }} className={`w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transform hover:scale-[1.02] transition-all`}>ابدأ الاستعداد</button>
            </div>
          </div>
        )}

        {(phase === 'ready' || phase === 'testing') && (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-4xl relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl mb-8">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain scale-x-[-1]" />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain scale-x-[-1]" />
              {phase === 'ready' && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-50">
                  <p className="text-2xl mb-4 font-bold">خذ وضعيتك الاستعدادية</p>
                  <div className="text-[12rem] font-black animate-pulse">{countdown}</div>
                  {currentStageInfo?.eyes === 'closed' && countdown <= 2 && <p className="text-red-400 text-3xl font-black animate-bounce mt-4">أغمض عينيك الآن!</p>}
                </div>
              )}
              {phase === 'testing' && (
                <div className="absolute top-6 left-6 bg-black/80 px-8 py-4 rounded-3xl border-2 border-green-500 text-center">
                  <p className="text-green-400 text-xs font-bold mb-1">نسبة الثبات</p>
                  <p className="text-5xl font-black text-white">{Math.max(0, 100 - Math.round(currentSwayRef.current))}%</p>
                </div>
              )}
              {phase === 'testing' && (
                <div className="absolute top-6 right-6 bg-black/80 px-6 py-3 rounded-full border border-white/20 flex items-center gap-3">
                  <Timer className="w-5 h-5 text-blue-400" />
                  <span className="text-2xl font-bold text-white">{timeRemaining}</span>
                </div>
              )}
            </div>
            <div className="w-full max-w-4xl bg-white rounded-2xl p-8 shadow-xl border border-slate-100">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 ${currentStageInfo?.color} rounded-full flex items-center justify-center text-white`}><Gauge className="w-6 h-6" /></div>
                <h2 className="text-2xl font-black text-slate-800">{currentStageInfo?.title}</h2>
              </div>
              <p className="text-slate-600 mb-6 font-bold">{currentStageInfo?.positionAr} - {currentStageInfo?.eyes === 'open' ? 'عينان مفتوحتان' : 'عينان مغلقتان'}</p>
              {phase === 'testing' && (
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300" style={{ width: `${100 - currentSwayRef.current}%` }} />
                </div>
              )}
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="max-w-2xl mx-auto w-full pb-10">
            <div className="bg-white rounded-[2rem] shadow-2xl p-8 text-center border-t-[12px] border-green-500">
              <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-4" />
              <h1 className="text-3xl font-black mb-4 text-slate-800">اكتمل الاختبار!</h1>
              <p className="text-slate-500 font-bold mb-8">{currentStageInfo?.title}</p>
              <div className="bg-slate-50 p-8 rounded-2xl mb-8 border border-slate-100">
                <p className="text-slate-400 font-bold text-sm mb-2 uppercase tracking-widest">Stability Score</p>
                <p className="text-7xl font-black text-green-600 mb-4">{stabilityScore}</p>
                <p className={`text-xl font-bold ${stabilityScore >= 80 ? 'text-green-600' : stabilityScore >= 60 ? 'text-blue-600' : 'text-amber-600'}`}>
                  {stabilityScore >= 80 ? 'ممتاز' : stabilityScore >= 60 ? 'جيد جداً' : 'يحتاج تحسين'}
                </p>
              </div>
              <button
                onClick={() => setPhase('select')}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transition-all"
              >
                العودة للاختيارات
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
