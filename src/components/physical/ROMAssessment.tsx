import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Camera, CheckCircle } from 'lucide-react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import { savePhysicalResult } from '../../utils/storage';
import { assessmentService } from '../../services/assessment.service';

interface ROMAssessmentProps {
  onBack: () => void;
  initialJoint?: Joint;
}

type Joint = 'shoulder' | 'hip' | 'knee' | 'ankle' | 'spine' | 'elbow' | 'wrist';
type Phase = 'intro' | 'calibration' | 'countdown' | 'measuring' | 'result';

const jointInfo = {
  shoulder: { name: 'الكتف', nameEn: 'Shoulder Mobility', instruction: 'ارفع ذراعك للأمام ولأعلى ببطء حتى أقصى مدى ممكن.', normalRange: { min: 160, max: 180 } },
  hip: { name: 'الورك', nameEn: 'Hip Rotation/Flexion', instruction: 'ارفع ركبتك للأعلى ببطء أو دور الورك.', normalRange: { min: 110, max: 125 } },
  knee: { name: 'الركبة', nameEn: 'Knee Flexion', instruction: 'اثنِ ركبتك للخلف ببطء حتى أقصى مدى ممكن.', normalRange: { min: 120, max: 150 } },
  ankle: { name: 'الكاحل', nameEn: 'Ankle Mobility', instruction: 'حرك قدمك للأعلى.', normalRange: { min: 15, max: 30 } },
  spine: { name: 'العمود الفقري', nameEn: 'Spine Alignment', instruction: 'قف بشكل مستقيم. سيتم قياس استقامة الجذع.', normalRange: { min: 0, max: 10 } },
  elbow: { name: 'الكوع', nameEn: 'Elbow Flexion', instruction: 'اثنِ كوعك للأعلى باتجاه الكتف.', normalRange: { min: 130, max: 150 } },
  wrist: { name: 'الرسغ', nameEn: 'Wrist Flexion', instruction: 'اثنِ رسغك للأسفل أو للأعلى.', normalRange: { min: 60, max: 80 } }
};

export function ROMAssessment({ onBack, initialJoint }: ROMAssessmentProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [selectedJoint, setSelectedJoint] = useState<Joint>(initialJoint || 'shoulder');
  const [angle, setAngle] = useState<number>(0);
  const [maxAngleObserved, setMaxAngleObserved] = useState<number>(0);
  const [countdown, setCountdown] = useState(5);
  const [measureTimer, setMeasureTimer] = useState(7);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const smoothedLandmarksRef = useRef<any[] | null>(null);

  const FPS_LIMIT = 12;
  const FRAME_INTERVAL = 1000 / FPS_LIMIT;
  const SMOOTHING_ALPHA = 0.15;
  const ANGLE_SMOOTHING_ALPHA = 0.2;
  const VISIBILITY_THRESHOLD = 0.6;

  const smoothedAngleRef = useRef<number>(0);

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
    if (phase !== 'intro' && phase !== 'result') initializeCamera();
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

  // Timer logic
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    } else if (phase === 'countdown' && countdown === 0) {
      setPhase('measuring');
    }
  }, [phase, countdown]);

  useEffect(() => {
    if (phase === 'measuring' && measureTimer > 0) {
      const t = setTimeout(() => setMeasureTimer(measureTimer - 1), 1000);
      return () => clearTimeout(t);
    } else if (phase === 'measuring' && measureTimer === 0) {
      setPhase('result');
      setAngle(maxAngleObserved);
    }
  }, [phase, measureTimer, maxAngleObserved]);

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
        const ctx = canvas.getContext("2d"); if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const drawingUtils = new DrawingUtils(ctx);
        for (const rawLandmarks of result.landmarks) {
          let smoothedLandmarks = smoothedLandmarksRef.current ? rawLandmarks.map((p, i) => ({
            x: smoothedLandmarksRef.current![i].x + (p.x - smoothedLandmarksRef.current![i].x) * SMOOTHING_ALPHA,
            y: smoothedLandmarksRef.current![i].y + (p.y - smoothedLandmarksRef.current![i].y) * SMOOTHING_ALPHA,
            z: p.z, visibility: p.visibility
          })) : rawLandmarks;
          smoothedLandmarksRef.current = smoothedLandmarks;
          drawingUtils.drawLandmarks(smoothedLandmarks, { radius: 2, color: '#FF0000', lineWidth: 1 });
          drawingUtils.drawConnectors(smoothedLandmarks, PoseLandmarker.POSE_CONNECTIONS, { color: '#007f8b', lineWidth: 3 });
          const lm = (i: number) => ({ x: smoothedLandmarks[i].x, y: smoothedLandmarks[i].y, v: smoothedLandmarks[i].visibility || 0 });

          let calcAngle = 0;
          let isVisible = false;

          const checkVis = (indices: number[]) => indices.every(i => lm(i).v > VISIBILITY_THRESHOLD);

          if (selectedJoint === 'shoulder') {
            const leftV = checkVis([23, 11, 13]);
            const rightV = checkVis([24, 12, 14]);
            if (leftV && rightV) calcAngle = Math.max(calculateAngle(lm(24), lm(12), lm(14)), calculateAngle(lm(23), lm(11), lm(13)));
            else if (leftV) calcAngle = calculateAngle(lm(23), lm(11), lm(13));
            else if (rightV) calcAngle = calculateAngle(lm(24), lm(12), lm(14));
            isVisible = leftV || rightV;
          }
          else if (selectedJoint === 'knee') {
            const leftV = checkVis([23, 25, 27]);
            const rightV = checkVis([24, 26, 28]);
            if (leftV && rightV) calcAngle = 180 - Math.min(calculateAngle(lm(24), lm(26), lm(28)), calculateAngle(lm(23), lm(25), lm(27)));
            else if (leftV) calcAngle = 180 - calculateAngle(lm(23), lm(25), lm(27));
            else if (rightV) calcAngle = 180 - calculateAngle(lm(24), lm(26), lm(28));
            isVisible = leftV || rightV;
          }
          else if (selectedJoint === 'hip') {
            const leftV = checkVis([11, 23, 25]);
            const rightV = checkVis([12, 24, 26]);
            if (leftV && rightV) calcAngle = 180 - Math.min(calculateAngle(lm(12), lm(24), lm(26)), calculateAngle(lm(11), lm(23), lm(25)));
            else if (leftV) calcAngle = 180 - calculateAngle(lm(11), lm(23), lm(25));
            else if (rightV) calcAngle = 180 - calculateAngle(lm(12), lm(24), lm(26));
            isVisible = leftV || rightV;
          }
          else if (selectedJoint === 'ankle') {
            const leftV = checkVis([25, 27, 31]);
            const rightV = checkVis([26, 28, 32]);
            // Ankle neutral is approx 90 degrees. Measure deviation from 90.
            if (leftV && rightV) calcAngle = Math.max(Math.abs(calculateAngle(lm(26), lm(28), lm(32)) - 90), Math.abs(calculateAngle(lm(25), lm(27), lm(31)) - 90));
            else if (leftV) calcAngle = Math.abs(calculateAngle(lm(25), lm(27), lm(31)) - 90);
            else if (rightV) calcAngle = Math.abs(calculateAngle(lm(26), lm(28), lm(32)) - 90);
            isVisible = leftV || rightV;
          }
          // Elbow, Wrist, Spine logic similarly updated with visibility checks
          else if (selectedJoint === 'elbow') {
            const leftV = checkVis([11, 13, 15]);
            const rightV = checkVis([12, 14, 16]);
            if (leftV && rightV) calcAngle = 180 - Math.min(calculateAngle(lm(12), lm(14), lm(16)), calculateAngle(lm(11), lm(13), lm(15)));
            else if (leftV) calcAngle = 180 - calculateAngle(lm(11), lm(13), lm(15));
            else if (rightV) calcAngle = 180 - calculateAngle(lm(12), lm(14), lm(16));
            isVisible = leftV || rightV;
          }
          else if (selectedJoint === 'wrist') {
            const leftV = checkVis([13, 15, 19]);
            const rightV = checkVis([14, 16, 20]);
            // Wrist neutral is 180 (straight). Flexion is deviation from 180.
            if (leftV && rightV) calcAngle = Math.max(180 - calculateAngle(lm(14), lm(16), lm(20)), 180 - calculateAngle(lm(13), lm(15), lm(19)));
            else if (leftV) calcAngle = 180 - calculateAngle(lm(13), lm(15), lm(19));
            else if (rightV) calcAngle = 180 - calculateAngle(lm(14), lm(16), lm(20));
            isVisible = leftV || rightV;
          }
          else if (selectedJoint === 'spine') {
            if (checkVis([11, 12, 23, 24])) {
              const ms = { x: (lm(11).x + lm(12).x) / 2, y: (lm(11).y + lm(12).y) / 2 };
              const mh = { x: (lm(23).x + lm(24).x) / 2, y: (lm(23).y + lm(24).y) / 2 };
              calcAngle = Math.abs(Math.abs(Math.atan2(mh.y - ms.y, mh.x - ms.x) * 180 / Math.PI) - 90);
              isVisible = true;
            }
          }

          if (isVisible && phase === 'measuring') {
            // Apply smoothing to the calculated angle
            const smoothed = smoothedAngleRef.current + ANGLE_SMOOTHING_ALPHA * (calcAngle - smoothedAngleRef.current);
            smoothedAngleRef.current = smoothed;

            const displayAngle = Math.round(smoothed);
            setAngle(displayAngle);
            setMaxAngleObserved(prev => Math.max(prev, displayAngle));
          } else if (!isVisible && phase === 'measuring') {
            // If not visible, maintain last known good value or just don't update
          }
        }
      });
      if (cameraActive) animationFrameId = requestAnimationFrame(predict);
    };
    if (cameraActive) predict(); return () => cancelAnimationFrame(animationFrameId);
  }, [cameraActive, phase, selectedJoint]);

  const saveResult = async () => {
    savePhysicalResult({ assessmentType: 'rom', joint: selectedJoint, value: angle, normalRange: jointInfo[selectedJoint].normalRange, timestamp: Date.now() });
    try { await assessmentService.createRom({ jointType: selectedJoint, maxAngle: angle, minAngle: 0 }); } catch (e) { console.error(e); }
  };

  if (phase === 'intro') {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={onBack} className="p-3 rounded-xl bg-white shadow-lg mb-6"><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-4 mb-6"><Camera className="w-12 h-12 text-blue-500" /><h1 className="text-3xl font-bold">تقييم المدى الحركي</h1></div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {(Object.keys(jointInfo) as Joint[]).map((joint) => (
                <button key={joint} onClick={() => setSelectedJoint(joint)} className={`p-4 rounded-xl border-2 transition-all ${selectedJoint === joint ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <h3 className="text-lg mb-1">{jointInfo[joint].name}</h3>
                  <p className="text-sm text-gray-600 font-bold">{jointInfo[joint].nameEn}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setPhase('calibration')} className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-lg shadow-lg">ابدأ القياس</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'calibration' || phase === 'countdown' || phase === 'measuring') {
    return (
      <div className="min-h-screen p-6 bg-gray-900 flex flex-col items-center">
        <div className="w-full max-w-4xl relative bg-black rounded-3xl overflow-hidden aspect-video mb-6 shadow-2xl">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-contain scale-x-[-1]" />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain scale-x-[-1]" />

          {phase === 'countdown' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white z-50">
              <h2 className="text-4xl mb-4 font-bold">استعد للحركة</h2>
              <div className="text-9xl font-black text-blue-400 animate-bounce">{countdown}</div>
            </div>
          )}

          {phase === 'measuring' && (
            <div className="absolute top-6 right-6 bg-black/80 px-8 py-4 rounded-3xl border-2 border-blue-500 z-50 text-center">
              <p className="text-blue-400 text-sm mb-1 font-bold">الزاوية الحالية</p>
              <p className="text-6xl font-black text-white">{angle}°</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <p className="text-white text-sm">جارٍ التسجيل: {measureTimer}ث</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-full max-w-4xl bg-white rounded-3xl p-8 shadow-xl text-center">
          {phase === 'calibration' ? (
            <>
              <h2 className="text-2xl font-bold mb-4">تعليمات القياس الذاتي</h2>
              <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                {jointInfo[selectedJoint].instruction}
                <br />سيتم تفعيل مؤقت آلي لمدة 5 ثوانٍ للاستعداد ثم 7 ثوانٍ للقياس.
              </p>
              <button onClick={() => { setPhase('countdown'); setCountdown(5); setMeasureTimer(7); setMaxAngleObserved(0); }} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-lg">ابدأ الآن</button>
            </>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">{phase === 'countdown' ? 'تجهيز الوضعية...' : 'تحرك ببطء لأقصى مدى!'}</h2>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(angle / 180) * 100}%` }} />
              </div>
              <p className="text-gray-500 font-bold">سيتم حفظ أعلى زاوية تصل إليها تلقائياً.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="p-3 rounded-xl bg-white shadow-lg mb-6"><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-14 h-14 text-green-600" /></div>
          <h1 className="text-3xl font-bold mb-2">اكتمل القياس</h1>
          <p className="text-gray-500 mb-8 font-bold">{jointInfo[selectedJoint].name} - {jointInfo[selectedJoint].nameEn}</p>
          <div className="bg-blue-50 p-10 rounded-3xl mb-8">
            <p className="text-gray-600 mb-2">أقصى زاوية تم تسجيلها</p>
            <p className="text-8xl font-black text-blue-600 mb-4">{angle}°</p>
            <p className={`text-xl font-bold ${angle >= jointInfo[selectedJoint].normalRange.min ? 'text-green-600' : 'text-amber-600'}`}>
              {angle >= jointInfo[selectedJoint].normalRange.min ? 'مستوى حركة طبيعي ممتاز' : 'مجال حركة محدود قليلاً'}
            </p>
          </div>

          <button onClick={() => { saveResult(); setPhase('intro'); setAngle(0); setMaxAngleObserved(0); }} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-2xl shadow-2xl transform hover:scale-[1.03] transition-all">حفظ وقياس آخر</button>
        </div>
      </div>
    </div>
  );
}