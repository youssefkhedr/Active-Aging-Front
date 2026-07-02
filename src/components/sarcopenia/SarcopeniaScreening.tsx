import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, HelpCircle, Camera } from 'lucide-react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import { saveSarcopeniaAssessment, type FunctionalTestResult } from '../../utils/storage';
import { assessmentService } from '../../services/assessment.service';

interface SarcopeniaScreeningProps {
  onBack: () => void;
  onComplete: () => void;
}

type ScreeningPhase = 'intro' | 'sarc-f' | 'functional-tests' | 'results';

const SARC_F_QUESTIONS = [
  { id: 'strength', question: 'كم تجد صعوبة في رفع أو حمل 4.5 كجم؟', questionEn: 'How much difficulty do you have lifting and carrying 10 pounds (4.5 kg)?', options: [{ value: 0, label: 'لا توجد صعوبة' }, { value: 1, label: 'صعوبة بسيطة' }, { value: 2, label: 'صعوبة كبيرة أو غير قادر' }] },
  { id: 'assistance', question: 'كم تجد صعوبة في المشي عبر الغرفة؟', questionEn: 'How much difficulty do you have walking across a room?', options: [{ value: 0, label: 'لا توجد صعوبة' }, { value: 1, label: 'صعوبة بسيطة' }, { value: 2, label: 'صعوبة كبيرة، استخدام مساعدات، أو غير قادر' }] },
  { id: 'rising', question: 'كم تجد صعوبة في النهوض من كرسي أو سرير؟', questionEn: 'How much difficulty do you have transferring from a chair or bed?', options: [{ value: 0, label: 'لا توجد صعوبة' }, { value: 1, label: 'صعوبة بسيطة' }, { value: 2, label: 'صعوبة كبيرة أو غير قادر بدون مساعدة' }] },
  { id: 'climbing', question: 'كم تجد صعوبة في صعود 10 درجات سلم؟', questionEn: 'How much difficulty do you have climbing a flight of 10 stairs?', options: [{ value: 0, label: 'لا توجد صعوبة' }, { value: 1, label: 'صعوبة بسيطة' }, { value: 2, label: 'صعوبة كبيرة أو غير قادر' }] },
  { id: 'falls', question: 'كم مرة سقطت في العام الماضي؟', questionEn: 'How many times have you fallen in the past year?', options: [{ value: 0, label: 'لا توجد سقطات' }, { value: 1, label: '1-3 سقطات' }, { value: 2, label: '4 سقطات أو أكثر' }] },
];

const FUNCTIONAL_TESTS = [
  {
    id: 'sit-to-stand-5',
    name: 'اختبار الجلوس والقيام (5 مرات)',
    nameEn: '5-Times Sit-to-Stand Test',
    instruction: 'اجلس على كرسي في وضع مريح. اضغط "بدء"، ثم قم واقف واجلس بالكامل 5 مرات بأسرع ما يمكن، ثم اضغط "إيقاف".',
    duration: 0, // Manual stop
    measurementType: 'duration' as const,
    safetyNote: 'استخدم كرسي ثابت. (الهدف: أقل من 15 ثانية)'
  },
  {
    id: 'gait-speed-4m',
    name: 'اختبار المشي (4 أمتار)',
    nameEn: '4-Meter Walk Test',
    instruction: 'حدد مسافة 4 أمتار. اضغط "بدء" عند خط البداية، امشِ بالسرعة المعتادة، واضغط "إيقاف" عند الوصول.',
    duration: 0,
    measurementType: 'duration' as const,
    safetyNote: 'تأكد من خلو المسار. (الهدف: سرعة أعلى من 0.8 م/ث)'
  },
];

export function SarcopeniaScreening({ onBack, onComplete }: SarcopeniaScreeningProps) {
  const [phase, setPhase] = useState<ScreeningPhase>('intro');
  const [sarcfAnswers, setSarcfAnswers] = useState<Record<string, number>>({});
  const [sarcfScore, setSarcfScore] = useState(0); // Explicit state for score

  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [testResults, setTestResults] = useState<FunctionalTestResult[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testTimer, setTestTimer] = useState(0);
  const [repsCount, setRepsCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastPositionRef = useRef<'up' | 'down' | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // Using ref for variables that don't need to trigger re-renders
  const [countdown, setCountdown] = useState<number | null>(null);
  const lastRepTimeRef = useRef(0);

  const gaitDistance = 4; // Fixed at 4m as per user request

  // Initialize MediaPipe
  useEffect(() => {
    const initModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });
        setIsModelLoaded(true);
      } catch (err) {
        console.error("Failed to load PoseLandmarker:", err);
      }
    };
    initModel();
  }, []);

  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access failed:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (phase === 'functional-tests') {
      initializeCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [phase, initializeCamera, stopCamera]);

  // AI Prediction Loop
  useEffect(() => {
    let animationFrameId: number;
    const predict = async () => {
      if (!poseLandmarkerRef.current || !videoRef.current || !canvasRef.current || !cameraActive) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx || video.readyState !== 4) {
        animationFrameId = requestAnimationFrame(predict);
        return;
      }

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const startTimeMs = performance.now();
      poseLandmarkerRef.current.detectForVideo(video, startTimeMs, (result) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const drawingUtils = new DrawingUtils(ctx);

        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0];
          drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
          drawingUtils.drawLandmarks(landmarks, { color: '#FF0000', lineWidth: 2 });

          // Sit-to-Stand Logic
          const currentTest = FUNCTIONAL_TESTS[currentTestIndex];
          if (isTestRunning && currentTest.id === 'sit-to-stand-5') {
            const leftHip = landmarks[23];
            const leftKnee = landmarks[25];
            const leftAnkle = landmarks[27];

            // Ensure full leg visibility
            if (leftHip.visibility > 0.5 && leftKnee.visibility > 0.5 && leftAnkle.visibility > 0.5) {
              // Vertical Aspect Ratio Method - Robust against Frontal View issues
              // Calculate vertical distance of thigh vs shin
              const thighLen = Math.abs(leftKnee.y - leftHip.y);
              const shinLen = Math.abs(leftAnkle.y - leftKnee.y);

              // Avoid division by zero
              if (shinLen > 0.05) {
                const ratio = thighLen / shinLen;

                const now = Date.now();
                const MIN_REP_TIME = 1500; // 1.5 seconds minimum between reps to avoid noise

                // Thresholds based on typical biomechanics
                // Standing: Ratio ~ 0.8 - 1.2 (Thigh is vertical like Shin)
                // Sitting: Ratio < 0.4 (Thigh is horizontal/foreshortened)

                const STAND_THRESHOLD = 0.55;
                const SIT_THRESHOLD = 0.35;

                if (ratio > STAND_THRESHOLD) {
                  // Detected Standing Pose
                  if (lastPositionRef.current === 'down') {
                    if (now - lastRepTimeRef.current > MIN_REP_TIME) {
                      setRepsCount(prev => {
                        const next = prev + 1;
                        if (next >= 5) {
                          setTimeout(() => completeCurrentTest(), 500);
                        }
                        return next;
                      });
                      lastRepTimeRef.current = now;
                    }
                    lastPositionRef.current = 'up';
                  }
                } else if (ratio < SIT_THRESHOLD) {
                  // Detected Sitting Pose
                  lastPositionRef.current = 'down';
                }

                // Debug Feedback
                if (ctx) {
                  ctx.font = "20px Monospace";
                  ctx.fillStyle = "white";
                  ctx.fillText(`R: ${ratio.toFixed(2)}`, 20, 40);
                  ctx.fillText(ratio > STAND_THRESHOLD ? "STATE: STAND" : (ratio < SIT_THRESHOLD ? "STATE: SIT" : "STATE: --"), 20, 70);
                }
              }
            }
          }
        }
      });

      animationFrameId = requestAnimationFrame(predict);
    };

    if (cameraActive) {
      animationFrameId = requestAnimationFrame(predict);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [cameraActive, isTestRunning, currentTestIndex]);

  // Manual Timer Logic
  useEffect(() => {
    let interval: number;
    if (isTestRunning) {
      const startTime = Date.now() - (testTimer * 1000);
      interval = window.setInterval(() => {
        setTestTimer((Date.now() - startTime) / 1000);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isTestRunning]);

  // Countdown Logic
  useEffect(() => {
    if (countdown !== null) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setCountdown(null);
        setIsTestRunning(true);
        setTestTimer(0);
        setRepsCount(0);
        lastPositionRef.current = null; // Reset for new test
        lastRepTimeRef.current = Date.now();
      }
    }
  }, [countdown]);

  const startTest = () => {
    setCountdown(3); // Start 3s countdown
  };

  const completeCurrentTest = async () => {
    if (!isTestRunning) return; // Prevent double completion

    const test = FUNCTIONAL_TESTS[currentTestIndex];
    let value = testTimer;

    if (test.id === 'gait-speed-4m') {
      value = gaitDistance / testTimer; // m/s
    }

    const result: FunctionalTestResult = {
      testId: test.id,
      timestamp: Date.now(),
      value: value,
      measurementType: test.measurementType
    };

    const newResults = [...testResults, result];
    setTestResults(newResults);
    saveSarcopeniaAssessment('functional', result);

    // Save 5TSTS specifically if that was the test
    if (test.id === 'sit-to-stand-5') {
      try {
        await assessmentService.create5Tsts({
          totalTimeSeconds: testTimer,
          validReps: 5
        });
      } catch (err) {
        console.error('Failed to save 5TSTS result:', err);
      }
    }

    setIsTestRunning(false);
    if (currentTestIndex < FUNCTIONAL_TESTS.length - 1) {
      setCurrentTestIndex(currentTestIndex + 1);
    } else {
      setPhase('results');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {phase !== 'intro' && phase !== 'results' && (
          <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 text-right">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                {phase === 'sarc-f' ? 'استبيان SARC-F' : FUNCTIONAL_TESTS[currentTestIndex].name}
              </h2>
            </div>
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white">
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
          </div>
        )}

        {phase === 'intro' && (
          <div className="max-w-3xl mx-auto">
            <button onClick={onBack} className="p-3 rounded-xl bg-white shadow-lg mb-6 border border-slate-100">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-10 h-10 text-orange-600" />
                </div>
                <div><h1 className="text-3xl font-bold">فحص الساركوبينيا</h1><p className="text-gray-600">Sarcopenia Screening Assessment</p></div>
              </div>
              <div className="space-y-6 mb-8 text-right">
                <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded"><p className="text-gray-700 text-sm">تقييم شامل لكتلة العضلات وقوتها من خلال استبيان وأداء حركي آلي.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-gray-50 rounded-2xl"><h4 className="font-bold mb-1">استبيان SARC-F</h4><p className="text-xs text-gray-500 italic">5 أسئلة بسيطة</p></div>
                  <div className="p-6 bg-gray-50 rounded-2xl"><h4 className="font-bold mb-1">اختبار الأداء الحركي</h4><p className="text-xs text-gray-500 italic">حساب يدوي للوقت (Sit-to-stand & Walk)</p></div>
                </div>
              </div>
              <button onClick={() => setPhase('sarc-f')} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-2xl shadow-2xl transform hover:scale-[1.03] transition-all">ابدأ الفحص</button>
            </div>
          </div>
        )}

        {phase === 'sarc-f' && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-8">استبيان SARC-F</h2>
            <div className="space-y-6 mb-10">
              {SARC_F_QUESTIONS.map((q, idx) => (
                <div key={q.id}>
                  <p className="font-bold mb-4">{idx + 1}. {q.question}</p>
                  <div className="space-y-2 mr-4">
                    {q.options.map(opt => (
                      <button key={opt.value} onClick={() => setSarcfAnswers({ ...sarcfAnswers, [q.id]: opt.value })} className={`w-full p-4 rounded-xl text-right border-2 transition-all ${sarcfAnswers[q.id] === opt.value ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold' : 'border-gray-100 hover:border-orange-200'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${sarcfAnswers[q.id] === opt.value ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                            {sarcfAnswers[q.id] === opt.value && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span>{opt.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={async () => {
                // Calculate score - Standard SARC-F scoring
                // 0 = No difficulty (healthy), 10 = High difficulty (risk)
                const standardScore = Object.values(sarcfAnswers).reduce((a, b) => a + b, 0);
                setSarcfScore(standardScore); // Standard SARC-F score

                // Save to backend
                try {
                  await assessmentService.createSarcf({
                    strength: sarcfAnswers['strength'],
                    walking: sarcfAnswers['assistance'],
                    chairRise: sarcfAnswers['rising'],
                    stairs: sarcfAnswers['climbing'],
                    falls: sarcfAnswers['falls']
                  });
                } catch (err) {
                  console.error('Failed to save SARC-F results:', err);
                }

                setPhase('functional-tests');
              }}
              disabled={!SARC_F_QUESTIONS.every(q => sarcfAnswers[q.id] !== undefined)}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              التالي: اختبارات الأداء
            </button>
          </div>
        )}

        {phase === 'functional-tests' && (
          <div className="flex flex-col items-center max-w-5xl mx-auto px-4">
            <div className="w-full bg-white rounded-3xl shadow-xl overflow-hidden mb-6 border-b-8 border-blue-500">
              <div className="flex flex-col md:flex-row">
                {/* Camera Feed */}
                <div className="relative w-full md:w-2/3 aspect-video bg-slate-900">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover scale-x-[-1]"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                  />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-white gap-3">
                      <Camera className="w-8 h-8 animate-pulse" />
                      <span className="font-bold">جاري تشغيل الكاميرا...</span>
                    </div>
                  )}

                  {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
                      <div className="text-9xl font-black text-white animate-ping">{countdown === 0 ? 'ابدأ!' : countdown}</div>
                    </div>
                  )}

                  {/* Overlay Stats */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-white text-right">
                      <p className="text-[10px] opacity-70 uppercase tracking-wider font-bold">الوقت</p>
                      <p className="text-2xl font-mono font-black">{testTimer.toFixed(1)}ث</p>
                    </div>
                    {FUNCTIONAL_TESTS[currentTestIndex].id === 'sit-to-stand-5' && (
                      <div className="bg-blue-600/90 backdrop-blur-md px-4 py-2 rounded-xl border border-blue-400 text-white text-right">
                        <p className="text-[10px] opacity-70 uppercase tracking-wider font-bold">المرات</p>
                        <p className="text-2xl font-black">{repsCount}/5</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructions & Controls */}
                <div className="w-full md:w-1/3 p-8 flex flex-col justify-center bg-slate-50">
                  <h2 className="text-2xl font-black mb-4 text-slate-800">{FUNCTIONAL_TESTS[currentTestIndex].name}</h2>
                  <div className="bg-white p-4 rounded-xl border-2 border-slate-100 mb-8 shadow-sm">
                    <p className="text-slate-600 font-medium leading-relaxed">{FUNCTIONAL_TESTS[currentTestIndex].instruction}</p>
                  </div>

                  {!isTestRunning ? (
                    <button
                      onClick={startTest}
                      disabled={!cameraActive || !isModelLoaded || countdown !== null}
                      className="w-full py-6 bg-green-500 text-white rounded-2xl font-black text-2xl shadow-xl hover:bg-green-600 transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {countdown !== null ? 'استعد...' : 'ابدأ الاختبار'}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <button
                        onClick={completeCurrentTest}
                        className="w-full py-6 bg-red-500 text-white rounded-2xl font-black text-2xl shadow-xl hover:bg-red-600 transform hover:scale-[1.02] transition-all animate-pulse"
                      >
                        إيقاف يدوي
                      </button>
                      {FUNCTIONAL_TESTS[currentTestIndex].id === 'sit-to-stand-5' && (
                        <p className="text-center text-blue-600 font-bold text-sm">سيتم الإنهاء تلقائياً عند إكمال 5 مرات</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Guidelines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <HelpCircle className="text-blue-600 w-6 h-6" />
                </div>
                <p className="text-blue-800 text-sm font-bold">{FUNCTIONAL_TESTS[currentTestIndex].safetyNote}</p>
              </div>
              <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-colors ${cameraActive ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cameraActive ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Camera className={cameraActive ? 'text-green-600' : 'text-red-600'} />
                </div>
                <p className={`text-sm font-bold ${cameraActive ? 'text-green-800' : 'text-red-800'}`}>
                  {cameraActive ? 'الكاميرا تعمل وجاهزة للرصد' : 'يرجى السماح بالوصول للكاميرا'}
                </p>
              </div>
            </div>
          </div>
        )}

        {phase === 'results' && (
          <div className="max-w-4xl mx-auto w-full bg-white rounded-3xl shadow-xl overflow-hidden border">
            <div className="bg-slate-50 p-6 border-b text-center"><h1 className="text-2xl font-bold text-slate-800">نتائج تقييم الساركوبينيا</h1></div>
            <div className="grid grid-cols-1 gap-6 p-8">
              {/* SARC-F Score */}
              <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-rose-800 text-lg">استبيان SARC-F</h3>
                  {/* Standard SARC-F: >= 4 indicates sarcopenia risk */}
                  <p className="text-rose-600 text-sm mt-1">{sarcfScore >= 4 ? 'مؤشر خطر (Sarcopenia Possible)' : 'طبيعي'}</p>
                </div>
                <div className="text-4xl font-black text-rose-600">
                  {sarcfScore}/10
                </div>
              </div>

              {/* 5-Times Sit-to-Stand */}
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-blue-800 text-lg">الجلوس والقيام (5 مرات)</h3>
                  {(() => {
                    const result = testResults.find(r => r.testId === 'sit-to-stand-5');
                    const time = result?.value || 0;
                    const isNormal = time < 15;
                    return (
                      <p className={`text-sm mt-1 font-bold ${isNormal ? 'text-green-600' : 'text-amber-600'}`}>
                        {isNormal ? 'طبيعي (< 15ث)' : 'احتمال ساركوبينيا (>= 15ث)'}
                      </p>
                    );
                  })()}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-blue-600">{testResults.find(r => r.testId === 'sit-to-stand-5')?.value.toFixed(1) || 0}</div>
                  <span className="text-xs text-blue-400 font-bold">ثانية</span>
                </div>
              </div>

              {/* Gait Speed */}
              <div className="bg-green-50 rounded-2xl p-6 border border-green-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-green-800 text-lg">سرعة المشي (4 أمتار)</h3>
                  {(() => {
                    const result = testResults.find(r => r.testId === 'gait-speed-4m');
                    const speed = result?.value || 0;
                    const isNormal = speed >= 0.8;
                    return (
                      <p className={`text-sm mt-1 font-bold ${isNormal ? 'text-green-600' : 'text-amber-600'}`}>
                        {isNormal ? 'طبيعي (>= 0.8 م/ث)' : 'احتمال ساركوبينيا (< 0.8 م/ث)'}
                      </p>
                    );
                  })()}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-green-600">{testResults.find(r => r.testId === 'gait-speed-4m')?.value.toFixed(2) || 0}</div>
                  <span className="text-xs text-green-400 font-bold">متر/ثانية</span>
                </div>
              </div>

              <button onClick={onComplete} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl transform hover:scale-[1.02] transition-all mt-4">العودة للرئيسية</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}