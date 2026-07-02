import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Camera, CheckCircle2, Timer } from 'lucide-react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import { saveScreeningResult } from '../../utils/storage';
import { assessmentService } from '../../services/assessment.service';

interface PhysicalScreeningProps {
  onBack: () => void;
  onComplete: (report: ScreeningReport) => void;
}

export interface JointStatus {
  joint: string;
  status: 'normal' | 'limited' | 'weak' | 'needs_correction';
  angle: number;
  normalRange: { min: number; max: number };
}

export interface ScreeningReport {
  timestamp: number;
  results: JointStatus[];
  overallStatus: string;
  recommendations: string[];
}

type ScreeningPhase = 'intro' | 'countdown' | 'testing' | 'complete';

const SCREENING_TESTS = [
  { id: 'shoulder', name: 'فحص حركة الكتف', nameEn: 'Shoulder Mobility', instruction: 'ارفع ذراعك ببطء للأعلى بأقصى ما تستطيع', normalRange: { min: 150, max: 180 }, targetAngle: 170 },
  { id: 'knee', name: 'فحص ثني الركبة', nameEn: 'Knee Flexion', instruction: 'اثنِ ركبتك ببطء بأقصى ما تستطيع', normalRange: { min: 120, max: 140 }, targetAngle: 130 },
  { id: 'hip', name: 'فحص دوران الورك', nameEn: 'Hip Rotation', instruction: 'حرّك فخذك للخارج ببطء', normalRange: { min: 40, max: 60 }, targetAngle: 50 },
  { id: 'spine', name: 'فحص استقامة العمود الفقري', nameEn: 'Spine Alignment', instruction: 'قف مستقيماً واثنِ جذعك للأمام', normalRange: { min: 70, max: 90 }, targetAngle: 80 },
  { id: 'ankle', name: 'فحص حركة الكاحل', nameEn: 'Ankle Mobility', instruction: 'اثنِ قدمك للأعلى بأقصى ما تستطيع', normalRange: { min: 15, max: 25 }, targetAngle: 20 },
];

export function PhysicalScreening({ onBack, onComplete }: PhysicalScreeningProps) {
  const [phase, setPhase] = useState<ScreeningPhase>('intro');
  const [currentTest, setCurrentTest] = useState(0);
  const [results, setResults] = useState<JointStatus[]>([]);
  const [measuredAngle, setMeasuredAngle] = useState(0);
  const [maxAngleObserved, setMaxAngleObserved] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [testTimer, setTestTimer] = useState(7);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const calculateAngle = (a: any, b: any, c: any) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return Math.round(angle);
  };

  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (phase === 'countdown' || phase === 'testing') initializeCamera();
    else stopCamera();
    return () => stopCamera();
  }, [phase]);

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

  // Timer Lifecycle
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    } else if (phase === 'countdown' && countdown === 0) {
      setPhase('testing');
      setTestTimer(7);
      setMaxAngleObserved(0);
    }
  }, [phase, countdown]);

  useEffect(() => {
    if (phase === 'testing' && testTimer > 0) {
      const t = setTimeout(() => setTestTimer(testTimer - 1), 1000);
      return () => clearTimeout(t);
    } else if (phase === 'testing' && testTimer === 0) {
      saveTestResult(maxAngleObserved);
    }
  }, [phase, testTimer, maxAngleObserved]);

  useEffect(() => {
    let animationFrameId: number;
    const predict = async () => {
      if (!poseLandmarkerRef.current || !videoRef.current || !canvasRef.current || phase !== 'testing') {
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
      poseLandmarkerRef.current.detectForVideo(video, startTimeMs, (result) => {
        const ctx = canvas.getContext("2d"); if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const drawingUtils = new DrawingUtils(ctx);
        for (const landmark of result.landmarks) {
          drawingUtils.drawLandmarks(landmark, { radius: 2, color: '#FF0000', lineWidth: 1 });
          drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, { color: '#007f8b', lineWidth: 3 });
          const lm = (i: number) => ({ x: landmark[i].x, y: landmark[i].y });
          const testId = SCREENING_TESTS[currentTest].id;
          let calcAngle = 0;
          if (testId === 'shoulder') calcAngle = Math.max(calculateAngle(lm(24), lm(12), lm(14)), calculateAngle(lm(23), lm(11), lm(13)));
          else if (testId === 'knee') calcAngle = 180 - Math.min(calculateAngle(lm(24), lm(26), lm(28)), calculateAngle(lm(23), lm(25), lm(27)));
          else if (testId === 'hip') calcAngle = 180 - Math.min(calculateAngle(lm(12), lm(24), lm(26)), calculateAngle(lm(11), lm(23), lm(25)));
          else if (testId === 'ankle') calcAngle = Math.max(calculateAngle(lm(24), lm(26), lm(28)) - 90, calculateAngle(lm(23), lm(25), lm(27)) - 90);
          else if (testId === 'spine') {
            const ms = { x: (lm(11).x + lm(12).x) / 2, y: (lm(11).y + lm(12).y) / 2 };
            const mh = { x: (lm(23).x + lm(24).x) / 2, y: (lm(23).y + lm(24).y) / 2 };
            calcAngle = Math.abs(Math.abs(Math.atan2(mh.y - ms.y, mh.x - ms.x) * 180 / Math.PI) - 90);
          }
          setMeasuredAngle(calcAngle);
          setMaxAngleObserved(prev => Math.max(prev, calcAngle));
        }
      });
      if (cameraActive) animationFrameId = requestAnimationFrame(predict);
    };
    if (cameraActive) predict(); return () => cancelAnimationFrame(animationFrameId);
  }, [cameraActive, phase, currentTest]);

  const saveTestResult = async (finalAngle: number) => {
    const test = SCREENING_TESTS[currentTest];
    let status: 'normal' | 'limited' | 'weak' | 'needs_correction';
    if (finalAngle >= test.normalRange.min && finalAngle <= test.normalRange.max) status = 'normal';
    else if (finalAngle >= test.normalRange.min * 0.7) status = 'limited';
    else if (finalAngle >= test.normalRange.min * 0.5) status = 'weak';
    else status = 'needs_correction';

    const result: JointStatus = { joint: test.id, status, angle: finalAngle, normalRange: test.normalRange };
    const newResults = [...results, result];
    setResults(newResults);

    try { await assessmentService.createRom({ jointType: test.id, maxAngle: finalAngle, minAngle: 0 }); } catch (e) { console.error(e); }

    if (currentTest < SCREENING_TESTS.length - 1) {
      setCurrentTest(currentTest + 1);
      setPhase('countdown');
      setCountdown(5);
      setMeasuredAngle(0);
      setMaxAngleObserved(0);
    } else {
      completeScreening(newResults);
    }
  };

  const completeScreening = (finalResults: JointStatus[]) => {
    const normalCount = finalResults.filter(r => r.status === 'normal').length;
    const needsCorrectionCount = finalResults.filter(r => r.status === 'needs_correction').length;
    let overallStatus = normalCount === finalResults.length ? 'excellent' : needsCorrectionCount === 0 ? 'good' : needsCorrectionCount <= 2 ? 'fair' : 'needs_attention';
    const recs: string[] = [];
    finalResults.forEach(r => { if (r.status === 'needs_correction') recs.push(`يحتاج ${SCREENING_TESTS.find(t => t.id === r.joint)?.name} لتدخل علاجي`); });
    const report: ScreeningReport = { timestamp: Date.now(), results: finalResults, overallStatus, recommendations: recs.length > 0 ? recs : ['جميع المفاصل في حالة جيدة'] };
    saveScreeningResult(report); setPhase('complete'); onComplete(report);
  };

  if (phase === 'intro') {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={onBack} className="p-3 rounded-xl bg-white shadow-lg mb-6"><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-4 mb-6"><Camera className="w-12 h-12 text-blue-500" /><div><h1 className="text-3xl font-bold">الفحص البدني الأولي</h1><p className="text-gray-600 font-bold">Physical Screening Assessment</p></div></div>
            <div className="bg-blue-50 border-r-4 border-blue-500 p-6 rounded-xl mb-8">
              <h3 className="font-bold mb-4">🎯 كيف يعمل الفحص؟</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex gap-2"><span>1.</span> سيتم فحص 5 مفاصل أساسية.</li>
                <li className="flex gap-2"><span>2.</span> لكل مفصل، معك 5 ثوانٍ للاستعداد و 7 ثوانٍ للحركة.</li>
                <li className="flex gap-2"><span>3.</span> تحرك ببطء حتى تصل لأقصى مدى مريح لك.</li>
              </ul>
            </div>
            <button onClick={() => { setPhase('countdown'); setCountdown(5); }} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-2xl shadow-2xl transform hover:scale-[1.03] transition-all">ابدأ الفحص الشامل</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'countdown' || phase === 'testing') {
    const test = SCREENING_TESTS[currentTest];
    const progress = ((currentTest + 1) / SCREENING_TESTS.length) * 100;
    return (
      <div className="min-h-screen p-6 bg-gray-900 flex flex-col items-center">
        <div className="w-full max-w-4xl mb-6 flex justify-between items-center text-white font-bold">
          <span>اختبار {currentTest + 1} / {SCREENING_TESTS.length}</span>
          <div className="flex gap-2 items-center bg-blue-600/30 px-4 py-1 rounded-full text-blue-400">
            <Timer className="w-4 h-4" />
            <span>{phase === 'countdown' ? `استعد: ${countdown}` : `سجل: ${testTimer}`}</span>
          </div>
        </div>

        <div className="w-full max-w-4xl relative bg-black rounded-3xl overflow-hidden aspect-video mb-6 shadow-2xl">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-contain scale-x-[-1]" />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain scale-x-[-1]" />

          {phase === 'countdown' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white z-50">
              <p className="text-xl mb-4 text-blue-400 font-bold">{test.name}</p>
              <h2 className="text-4xl mb-6 font-bold">{test.instruction}</h2>
              <div className="text-[12rem] font-black animate-pulse text-white">{countdown}</div>
            </div>
          )}

          {phase === 'testing' && (
            <div className="absolute top-6 right-6 bg-black/80 px-8 py-4 rounded-3xl border-2 border-green-500 z-50 text-center">
              <p className="text-green-400 text-sm mb-1 font-bold">الزاوية المقاسة</p>
              <p className="text-6xl font-black text-white">{measuredAngle}°</p>
              <div className="mt-2 text-xs text-gray-400 font-bold">الهدف: {test.normalRange.min}°</div>
            </div>
          )}
        </div>

        <div className="w-full max-w-4xl bg-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-xl">{currentTest + 1}</div>
            <div>
              <h3 className="font-black text-xl">{test.name}</h3>
              <p className="text-gray-500 text-sm">{test.instruction}</p>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-12 h-12 text-blue-600" /></div>
          <h1 className="text-4xl font-black mb-2">اكتمل الفحص الشامل</h1>
          <p className="text-gray-500 font-bold">تم تقييم حالة المفاصل الخمسة بنجاح</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {results.map((r, i) => (
            <div key={i} className={`p-6 rounded-2xl border-2 ${r.status === 'normal' ? 'border-green-100 bg-green-50' : 'border-amber-100 bg-amber-50'}`}>
              <p className="text-sm font-bold text-gray-500 mb-1">{SCREENING_TESTS.find(t => t.id === r.joint)?.name}</p>
              <p className="text-4xl font-black mb-2">{r.angle}°</p>
              <div className="text-xs font-bold uppercase tracking-wider">{r.status === 'normal' ? '✓ طبيعي' : '⚠ يحتاج تقوية'}</div>
            </div>
          ))}
        </div>
        <button onClick={onBack} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:bg-blue-700 transition-all">العودة للرئيسية</button>
      </div>
    </div>
  );
}
