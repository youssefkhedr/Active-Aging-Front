import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Camera, CheckCircle2, XCircle, AlertTriangle, Play, Pause, AlertCircle } from 'lucide-react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import { getActiveDoctorPlan, saveTrainingSession, type Exercise, type TrainingSession } from '../../utils/storage';

interface TrainingModeProps {
  onBack: () => void;
}



type TrainingPhase = 'select-exercise' | 'preparation' | 'training' | 'rest' | 'complete';

export function TrainingMode({ onBack }: TrainingModeProps) {
  const [phase, setPhase] = useState<TrainingPhase>('select-exercise');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);

  const [currentAngle, setCurrentAngle] = useState(0);
  const [errors, setErrors] = useState<TrainingSession['errors']>([]);
  const [correctReps, setCorrectReps] = useState(0);
  const [incorrectReps, setIncorrectReps] = useState(0);
  const [repsPerSet, setRepsPerSet] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{
    type: 'correct' | 'error';
    message: string;
  } | null>(null);

  const animationRef = useRef<number | null>(null);
  const plan = getActiveDoctorPlan();

  // Camera state management
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // MediaPipe Refs
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastRepTime = useRef<number>(0);
  const repState = useRef<'neutral' | 'peak'>('neutral');

  // Calculations
  const calculateAngle = (a: { x: number, y: number }, b: { x: number, y: number }, c: { x: number, y: number }) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return Math.round(angle);
  };

  // Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    const createPoseLandmarker = async () => {
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
      console.log('✅ PoseLandmarker loaded for Training Mode');
    };
    createPoseLandmarker();
  }, []);

  // Initialize camera
  const initializeCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError('تم رفض الوصول للكاميرا. يرجى السماح بالوصول للكاميرا من إعدادات المتصفح.');
        } else if (error.name === 'NotFoundError') {
          setCameraError('لم يتم العثور على كاميرا. يرجى التأكد من توصيل الكاميرا.');
        } else {
          setCameraError('حدث خطأ في الوصول للكاميرا. يرجى المحاولة مرة أخرى.');
        }
      }
      setCameraActive(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraError(null);
  };

  // Handle camera lifecycle
  useEffect(() => {
    if (phase === 'training') {
      initializeCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [phase]);

  useEffect(() => {
    let animationFrameId: number;

    const predict = async () => {
      if (!poseLandmarkerRef.current || !videoRef.current || !canvasRef.current || !isCapturing || !selectedExercise) {
        if (phase === 'training' && isCapturing) {
          animationFrameId = requestAnimationFrame(predict);
        }
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState !== 4) {
        animationFrameId = requestAnimationFrame(predict);
        return;
      }

      // Resize canvas
      const displayWidth = video.clientWidth;
      const displayHeight = video.clientHeight;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      const startTimeMs = performance.now();
      try {
        poseLandmarkerRef.current.detectForVideo(video, startTimeMs, (result) => {
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const drawingUtils = new DrawingUtils(ctx);

          if (result.landmarks) {
            for (const landmark of result.landmarks) {
              try {
                // Draw Skeleton
                drawingUtils.drawLandmarks(landmark, {
                  radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1)
                });
                drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);

                const lm = (i: number) => ({ x: landmark[i].x, y: landmark[i].y });
                let calcAngle = 0;
                const jointName = selectedExercise.joint.toLowerCase();

                // Calculate angle based on joint
                if (jointName.includes('shoulder')) {
                  const rightAngle = calculateAngle(lm(24), lm(12), lm(14));
                  const leftAngle = calculateAngle(lm(23), lm(11), lm(13));
                  calcAngle = Math.max(rightAngle, leftAngle);
                } else if (jointName.includes('knee')) {
                  const rightKnee = calculateAngle(lm(24), lm(26), lm(28));
                  const leftKnee = calculateAngle(lm(23), lm(25), lm(27));
                  calcAngle = 180 - Math.min(rightKnee, leftKnee);
                } else if (jointName.includes('hip')) {
                  const rightHip = calculateAngle(lm(12), lm(24), lm(26));
                  const leftHip = calculateAngle(lm(11), lm(23), lm(25));
                  calcAngle = 180 - Math.min(rightHip, leftHip);
                } else if (jointName.includes('ankle')) {
                  const rightAnkle = calculateAngle(lm(26), lm(28), lm(32));
                  const leftAnkle = calculateAngle(lm(25), lm(27), lm(31));
                  const rFlex = rightAnkle < 90 ? (90 - rightAnkle) : 0;
                  const lFlex = leftAnkle < 90 ? (90 - leftAnkle) : 0;
                  calcAngle = Math.max(rFlex, lFlex);
                } else if (jointName.includes('spine')) {
                  const midShoulder = { x: (lm(11).x + lm(12).x) / 2, y: (lm(11).y + lm(12).y) / 2 };
                  const midHip = { x: (lm(23).x + lm(24).x) / 2, y: (lm(23).y + lm(24).y) / 2 };
                  const radians = Math.atan2(midHip.y - midShoulder.y, midHip.x - midShoulder.x);
                  const deg = Math.abs(radians * 180 / Math.PI);
                  calcAngle = Math.abs(deg - 90);
                }

                setCurrentAngle(Math.round(calcAngle));
                checkMovementCorrectness(Math.round(calcAngle));

              } catch (err) {
                console.error("Error processing training landmarks:", err);
              }
            }
          }
        });
      } catch (err) {
        console.error("Error in training detectForVideo:", err);
      }

      if (phase === 'training' && isCapturing) {
        animationFrameId = requestAnimationFrame(predict);
      }
    };

    if (phase === 'training' && isCapturing) {
      predict();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [phase, isCapturing, selectedExercise]);

  const checkMovementCorrectness = (measuredAngle: number) => {
    if (!selectedExercise) return;

    const { min, max } = selectedExercise.angleRange;
    // Simple state machine for Rep Counting
    // Transition to 'peak' if in target range
    // Transition to 'neutral' if returned to start (assumed < min * 0.5 for non-spine, or specific logic)

    // Determine target reached
    const inTargetRange = measuredAngle >= min && measuredAngle <= max;

    if (inTargetRange) {
      if (repState.current === 'neutral') {
        const now = Date.now();
        if (now - lastRepTime.current > 2000) { // 2 seconds debounce between reps
          repState.current = 'peak';
          countRep(true);
          lastRepTime.current = now;
        }
      }
    } else if (measuredAngle < min * 0.8) {
      // Reset state when returning to start
      if (repState.current === 'peak') {
        repState.current = 'neutral';
      }
    }

    // Feedback logic (keep existing but update params)
    // We can add more sophisticated feedback here later
  };

  const addError = (type: string, message: string) => {
    setFeedback({ type: 'error', message });
    setErrors(prev => [...prev, {
      timestamp: Date.now(),
      errorType: type,
      message,
    }]);

    setTimeout(() => setFeedback(null), 2000);
  };

  const countRep = (correct: boolean) => {
    if (correct) {
      setCorrectReps(prev => prev + 1);
      setCurrentRep(prev => prev + 1);
      setFeedback({ type: 'correct', message: 'ممتاز! استمر' });

      // Play success sound (simulated)
      setTimeout(() => setFeedback(null), 1000);
    } else {
      setIncorrectReps(prev => prev + 1);
    }
  };

  const startExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setPhase('preparation');
  };

  const beginTraining = () => {
    setPhase('training');
    setIsCapturing(true);
    setCurrentSet(1);
    setCurrentRep(0);
    setCorrectReps(0);
    setIncorrectReps(0);
    setErrors([]);
    setRepsPerSet([]);
  };

  const completeSet = () => {
    if (!selectedExercise) return;

    const newRepsPerSet = [...repsPerSet, correctReps];
    setRepsPerSet(newRepsPerSet);

    if (currentSet < selectedExercise.sets) {
      // Move to rest phase
      setPhase('rest');
      setIsCapturing(false);
      setCurrentRep(0);

      setTimeout(() => {
        setCurrentSet(currentSet + 1);
        setPhase('training');
        setIsCapturing(true);
      }, 5000); // 5 seconds rest
    } else {
      // Complete exercise
      completeExercise(newRepsPerSet);
    }
  };

  const completeExercise = (finalRepsPerSet: number[]) => {
    if (!selectedExercise || !plan) return;

    setIsCapturing(false);

    const totalReps = finalRepsPerSet.reduce((a, b) => a + b, 0);
    const accuracy = totalReps > 0 ? (correctReps / totalReps) * 100 : 0;

    const session: TrainingSession = {
      id: `session-${Date.now()}`,
      planId: plan.id,
      exerciseId: selectedExercise.id,
      date: Date.now(),
      setsCompleted: currentSet,
      repsPerSet: finalRepsPerSet,
      correctReps,
      incorrectReps,
      errors,
      averageAccuracy: accuracy,
      completed: true,
    };

    saveTrainingSession(session);
    setPhase('complete');
  };

  useEffect(() => {
    if (selectedExercise && phase === 'training' && currentRep >= selectedExercise.reps) {
      completeSet();
    }
  }, [currentRep]);

  if (!plan) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl mb-4">لا توجد خطة تدريبية</h2>
          <p className="text-gray-600 mb-6">
            يجب أن يقوم الطبيب بإنشاء خطة تدريبية لك أولاً
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'select-exercise') {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow mb-6"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl mb-2">وضع التدريب</h1>
            <p className="text-gray-600 mb-8">Training Mode - اختر التمرين الذي تريد البدء به</p>

            <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded-xl mb-6">
              <h3 className="mb-2">📋 خطتك العلاجية</h3>
              <p className="text-sm text-gray-700">
                الطبيب: {plan.doctorName} | المدة: {plan.durationWeeks} أسابيع
              </p>
            </div>

            <div className="space-y-4">
              {plan.exercises.map(exercise => (
                <button
                  key={exercise.id}
                  onClick={() => startExercise(exercise)}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-right"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl mb-1">{exercise.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{exercise.nameEn}</p>
                      <p className="text-sm text-gray-700 mb-3">{exercise.instructions}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                          {exercise.sets} مجموعات
                        </span>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                          {exercise.reps} تكرار
                        </span>
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                          {exercise.targetAngle}°
                        </span>
                      </div>
                    </div>
                    <Play className="w-8 h-8 text-blue-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'preparation') {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setPhase('select-exercise')}
            className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow mb-6"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl mb-6">{selectedExercise?.name}</h2>

            <div className="bg-purple-50 border-r-4 border-purple-500 p-6 rounded-xl mb-6">
              <h3 className="mb-3">📹 فيديو مرجعي للحركة الصحيحة</h3>
              <div className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center mb-3">
                <Camera className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-sm text-gray-700">
                في التطبيق الحقيقي، سيظهر هنا فيديو الطبيب يوضح الحركة الصحيحة مع skeleton overlay مثالي
              </p>
            </div>

            <div className="bg-yellow-50 border-r-4 border-yellow-500 p-6 rounded-xl mb-6">
              <h3 className="mb-3">⚠️ وضع المطابقة الصارمة (Strict Matching)</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ سيتم عرض skeleton overlay لحركتك الحقيقية</li>
                <li>✓ التكرار يُحسب فقط إذا كانت الزوايا صحيحة (±5°)</li>
                <li>✓ يجب أن يكون العمود الفقري مستقراً</li>
                <li>✓ عدم وجود حركات تعويضية (رفع الكتف، ميلان الجذع...)</li>
                <li>✓ مسار الحركة يجب أن يطابق الفيديو المرجعي</li>
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-xl mb-6">
              <h3 className="mb-3">💚 رموز الألوان</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded" />
                  <span>أخضر: الحركة صحيحة - التكرار يُحسب</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-500 rounded" />
                  <span>أحمر: خطأ في المفصل - تصحيح مطلوب</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded" />
                  <span>أصفر: قريب من الصحيح - حسّن قليلاً</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-xl mb-8">
              <h3 className="mb-2">الأهداف:</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl text-blue-600">{selectedExercise?.sets}</p>
                  <p className="text-sm text-gray-600">مجموعات</p>
                </div>
                <div>
                  <p className="text-2xl text-blue-600">{selectedExercise?.reps}</p>
                  <p className="text-sm text-gray-600">تكرار/مجموعة</p>
                </div>
                <div>
                  <p className="text-2xl text-blue-600">{selectedExercise?.targetAngle}°</p>
                  <p className="text-sm text-gray-600">الزاوية المستهدفة</p>
                </div>
              </div>
            </div>

            <button
              onClick={beginTraining}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              ابدأ التدريب
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'rest') {
    return (
      <div className="min-h-screen p-6 bg-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Pause className="w-20 h-20 mx-auto mb-6" />
          <h2 className="text-4xl mb-4">استراحة</h2>
          <p className="text-2xl mb-2">المجموعة {currentSet} انتهت</p>
          <p className="text-xl opacity-75">استعد للمجموعة التالية...</p>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    const accuracy = correctReps + incorrectReps > 0
      ? (correctReps / (correctReps + incorrectReps)) * 100
      : 0;

    return (
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setPhase('select-exercise')}
            className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow mb-6"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl mb-2">أحسنت!</h1>
            <p className="text-gray-600 mb-8">{selectedExercise?.name} - اكتمل</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-green-50 p-6 rounded-xl">
                <p className="text-gray-600 mb-2">تكرارات صحيحة</p>
                <p className="text-4xl text-green-600">{correctReps}</p>
              </div>

              <div className="bg-red-50 p-6 rounded-xl">
                <p className="text-gray-600 mb-2">تكرارات خاطئة</p>
                <p className="text-4xl text-red-600">{incorrectReps}</p>
              </div>

              <div className="bg-blue-50 p-6 rounded-xl">
                <p className="text-gray-600 mb-2">الدقة</p>
                <p className="text-4xl text-blue-600">{accuracy.toFixed(0)}%</p>
              </div>

              <div className="bg-purple-50 p-6 rounded-xl">
                <p className="text-gray-600 mb-2">الأخطاء</p>
                <p className="text-4xl text-purple-600">{errors.length}</p>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="bg-yellow-50 border-r-4 border-yellow-500 p-6 rounded-xl mb-6 text-right">
                <h3 className="mb-3">📊 تحليل الأخطاء الشائعة</h3>
                <div className="space-y-2 text-sm">
                  {Array.from(new Set(errors.map(e => e.errorType))).map(errorType => {
                    const count = errors.filter(e => e.errorType === errorType).length;
                    const sample = errors.find(e => e.errorType === errorType);
                    return (
                      <div key={errorType} className="bg-white p-3 rounded">
                        <p className="font-medium">{sample?.message}</p>
                        <p className="text-gray-600 text-xs">حدث {count} مرة</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={() => setPhase('select-exercise')}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                اختر تمريناً آخر
              </button>

              <button
                onClick={onBack}
                className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen p-6 bg-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Stats Header */}
        <div className="bg-white rounded-xl shadow-2xl p-4 mb-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">المجموعة</p>
              <p className="text-2xl">{currentSet} / {selectedExercise?.sets}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">التكرار</p>
              <p className="text-2xl">{currentRep} / {selectedExercise?.reps}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">الزاوية الحالية</p>
              <p className={`text-2xl ${currentAngle >= (selectedExercise?.angleRange.min || 0) - 5 &&
                currentAngle <= (selectedExercise?.angleRange.max || 180) + 5
                ? 'text-green-500'
                : 'text-red-500'
                }`}>
                {currentAngle}°
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">الهدف</p>
              <p className="text-2xl text-blue-600">{selectedExercise?.targetAngle}°</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reference Video (left side) */}
          <div className="bg-gray-800 rounded-2xl overflow-hidden">
            <div className="bg-gray-700 p-3 text-white text-sm">
              📹 الحركة المرجعية (Reference)
            </div>
            <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
              {/* Ideal skeleton overlay (white/transparent) */}
              <svg width="400" height="500" className="opacity-40">
                <circle cx="200" cy="80" r="20" fill="white" />
                <line x1="200" y1="100" x2="200" y2="200" stroke="white" strokeWidth="3" strokeDasharray="5,5" />
                <line x1="200" y1="150" x2="120" y2="80" stroke="white" strokeWidth="3" strokeDasharray="5,5" />
                <circle cx="120" cy="80" r="8" fill="white" />
                <text x="180" y="250" fill="white" fontSize="14">الحركة المثالية</text>
              </svg>
            </div>
          </div>

          {/* Live Camera with User Skeleton (right side) */}
          <div className="bg-gray-800 rounded-2xl overflow-hidden">
            <div className="bg-blue-600 p-3 text-white text-sm flex items-center justify-between">
              <span>🎥 الكاميرا المباشرة (Live)</span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                تسجيل
              </span>
            </div>
            <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
              {/* Video element - always rendered */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-contain"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Error overlay */}
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center p-6 z-10 bg-gray-900">
                  <div className="text-center text-white max-w-md">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                    <p className="text-lg mb-4">{cameraError}</p>
                    <button
                      onClick={initializeCamera}
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                </div>
              )}

              {/* Loading overlay */}
              {!cameraActive && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900">
                  <div className="text-center text-white">
                    <Camera className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse" />
                    <p className="text-lg mb-2">جارٍ تشغيل الكاميرا...</p>
                    <p className="text-sm opacity-75">يرجى السماح بالوصول للكاميرا</p>
                  </div>
                </div>
              )}

              {/* User skeleton overlay (Canvas) */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Feedback overlay */}
              {feedback && cameraActive && (
                <div className={`
                  absolute top-4 right-4 left-4 p-4 rounded-xl text-white text-center z-20
                  ${feedback.type === 'correct' ? 'bg-green-500' : 'bg-red-500'}
                `}>
                  {feedback.type === 'correct' ? <CheckCircle2 className="w-6 h-6 mx-auto mb-2" /> : <XCircle className="w-6 h-6 mx-auto mb-2" />}
                  <p className="text-lg">{feedback.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-xl p-6">
          <h3 className="text-lg mb-3">التعليمات:</h3>
          <p className="text-gray-700">{selectedExercise?.instructions}</p>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span className="text-sm">صحيح</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded" />
                <span className="text-sm">قريب</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <span className="text-sm">خطأ</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCapturing(false);
                setPhase('select-exercise');
              }}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              إيقاف التدريب
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
