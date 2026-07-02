import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Trophy, Target } from 'lucide-react';
import { saveGameResult } from '../../utils/storage';

interface TrailMakingTestProps {
  onBack: () => void;
}

type TestType = 'A' | 'B';
type GameState = 'intro' | 'playing' | 'finished';

interface Point {
  id: number;
  x: number;
  y: number;
  label: string;
  completed: boolean;
}

export function TrailMakingTest({ onBack }: TrailMakingTestProps) {
  const [testType, setTestType] = useState<TestType>('A');
  const [gameState, setGameState] = useState<GameState>('intro');
  const [points, setPoints] = useState<Point[]>([]);
  const [currentTarget, setCurrentTarget] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [completionTime, setCompletionTime] = useState(0);
  const [path, setPath] = useState<{ x: number; y: number }[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const generatePoints = (type: TestType) => {
    const newPoints: Point[] = [];
    const count = type === 'A' ? 15 : 13; // TMT-B has alternating numbers and letters
    const containerWidth = 600;
    const containerHeight = 600;
    const padding = 60;

    if (type === 'A') {
      // TMT-A: Numbers only (1-15)
      for (let i = 1; i <= count; i++) {
        let x, y;
        let overlap;
        do {
          overlap = false;
          x = padding + Math.random() * (containerWidth - 2 * padding);
          y = padding + Math.random() * (containerHeight - 2 * padding);
          
          // Check overlap with existing points
          for (const point of newPoints) {
            const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
            if (dist < 80) {
              overlap = true;
              break;
            }
          }
        } while (overlap);

        newPoints.push({
          id: i,
          x,
          y,
          label: i.toString(),
          completed: false,
        });
      }
    } else {
      // TMT-B: Alternating numbers and letters (1-A-2-B-3-C...)
      const letters = ['أ', 'ب', 'ج', 'د', 'ه', 'و', 'ز'];
      for (let i = 0; i < count; i++) {
        let x, y;
        let overlap;
        do {
          overlap = false;
          x = padding + Math.random() * (containerWidth - 2 * padding);
          y = padding + Math.random() * (containerHeight - 2 * padding);
          
          for (const point of newPoints) {
            const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
            if (dist < 80) {
              overlap = true;
              break;
            }
          }
        } while (overlap);

        const label = i % 2 === 0 ? (Math.floor(i / 2) + 1).toString() : letters[Math.floor(i / 2)];
        newPoints.push({
          id: i,
          x,
          y,
          label,
          completed: false,
        });
      }
    }

    setPoints(newPoints);
    setCurrentTarget(0);
    setErrors(0);
    setPath([]);
  };

  const startGame = () => {
    generatePoints(testType);
    setStartTime(Date.now());
    setGameState('playing');
  };

  const handlePointClick = (clickedIndex: number) => {
    if (clickedIndex === currentTarget) {
      // Correct point clicked
      const newPoints = [...points];
      newPoints[clickedIndex].completed = true;
      setPoints(newPoints);
      
      // Add to path
      setPath([...path, { x: points[clickedIndex].x, y: points[clickedIndex].y }]);

      if (currentTarget === points.length - 1) {
        // Test completed
        const timeTaken = Date.now() - startTime;
        setCompletionTime(timeTaken);
        finishGame(timeTaken);
      } else {
        setCurrentTarget(currentTarget + 1);
      }
    } else {
      // Wrong point clicked
      setErrors(errors + 1);
    }
  };

  const finishGame = (timeTaken: number) => {
    const accuracy = Math.max(0, 100 - (errors * 10));
    
    saveGameResult({
      gameType: testType === 'A' ? 'stroop' : 'memory', // Using existing types
      score: points.length - errors,
      maxScore: points.length,
      accuracy,
      avgReactionTime: timeTaken / points.length,
      timestamp: Date.now(),
    });

    setGameState('finished');
  };

  if (gameState === 'intro') {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onBack}
            className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow mb-6"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <Target className="w-12 h-12 text-orange-500" />
              <div>
                <h1 className="text-3xl">اختبار Trail Making</h1>
                <p className="text-gray-600">TMT - Visual Attention & Processing Speed</p>
              </div>
            </div>

            <div className="space-y-4 mb-8 text-gray-700">
              <p>
                اختبار Trail Making يقيس الانتباه البصري، سرعة المعالجة، والمرونة المعرفية.
              </p>

              <div className="bg-orange-50 border-r-4 border-orange-500 p-4 rounded">
                <h3 className="mb-2">نوع الاختبار:</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setTestType('A')}
                    className={`w-full p-4 rounded-lg text-right transition-all ${
                      testType === 'A'
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'bg-white border-2 border-orange-200'
                    }`}
                  >
                    <h4 className="mb-1">TMT-A (الجزء الأول - أسهل)</h4>
                    <p className="text-sm opacity-90">
                      وصّل الأرقام بالترتيب: 1 → 2 → 3 → 4 ... 15
                    </p>
                  </button>

                  <button
                    onClick={() => setTestType('B')}
                    className={`w-full p-4 rounded-lg text-right transition-all ${
                      testType === 'B'
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'bg-white border-2 border-orange-200'
                    }`}
                  >
                    <h4 className="mb-1">TMT-B (الجزء الثاني - أصعب)</h4>
                    <p className="text-sm opacity-90">
                      بدّل بين الأرقام والحروف: 1 → أ → 2 → ب → 3 → ج
                    </p>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded">
                <h3 className="mb-2">كيفية اللعب:</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>ستظهر لك نقاط على الشاشة بأرقام أو حروف</li>
                  <li>اضغط على النقاط بالترتيب الصحيح بأسرع ما يمكن</li>
                  <li>حاول عدم الضغط على نقطة خاطئة</li>
                  <li>سيتم رسم خط يربط النقاط التي تضغط عليها</li>
                </ol>
              </div>

              <div className="bg-purple-50 p-4 rounded">
                <h3 className="mb-2">💡 فائدة الاختبار:</h3>
                <p>
                  TMT-A يقيس سرعة المعالجة البصرية والانتباه البسيط.
                  <br />
                  TMT-B يقيس المرونة المعرفية والقدرة على التبديل بين المهام.
                </p>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              ابدأ الاختبار (TMT-{testType})
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const timeInSeconds = (completionTime / 1000).toFixed(1);
    const accuracy = Math.max(0, 100 - (errors * 10));

    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onBack}
            className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow mb-6"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Trophy className="w-20 h-20 text-orange-500 mx-auto mb-6" />
            <h1 className="text-3xl mb-2">نتائج الاختبار</h1>
            <p className="text-gray-600 mb-8">TMT-{testType}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                <p className="text-gray-600 mb-2">وقت الإنجاز</p>
                <p className="text-4xl text-blue-600">{timeInSeconds}s</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl">
                <p className="text-gray-600 mb-2">الأخطاء</p>
                <p className="text-4xl text-red-600">{errors}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                <p className="text-gray-600 mb-2">الدقة</p>
                <p className="text-4xl text-green-600">{accuracy}%</p>
              </div>
            </div>

            <div className={`
              p-4 rounded-xl mb-6
              ${completionTime < (testType === 'A' ? 30000 : 75000) && errors === 0 
                ? 'bg-green-50 border-2 border-green-500' 
                : 'bg-blue-50 border-2 border-blue-500'
              }
            `}>
              <h3 className="mb-2">التقييم:</h3>
              <p className="text-gray-700">
                {testType === 'A' && completionTime < 30000 && errors === 0 && 
                  '🎉 ممتاز! أداؤك في TMT-A سريع ودقيق. جرب TMT-B!'}
                {testType === 'B' && completionTime < 75000 && errors === 0 && 
                  '🏆 رائع جداً! مرونتك المعرفية عالية'}
                {errors > 3 && 
                  '💡 حاول التركيز على الدقة أكثر من السرعة'}
                {errors <= 3 && completionTime > (testType === 'A' ? 45000 : 120000) && 
                  '👍 أداء جيد! مع التدريب ستصبح أسرع'}
              </p>
            </div>

            <div className="space-y-4">
              {testType === 'A' && accuracy >= 80 && (
                <button
                  onClick={() => {
                    setTestType('B');
                    setGameState('intro');
                  }}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  انتقل لـ TMT-B (أصعب)
                </button>
              )}

              <button
                onClick={() => setGameState('intro')}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                إعادة الاختبار
              </button>

              <button
                onClick={onBack}
                className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                العودة للقائمة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Playing state
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Stats Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex justify-between items-center">
          <div>
            <span className="text-gray-600">النقطة المطلوبة: </span>
            <span className="text-2xl ml-2">{points[currentTarget]?.label}</span>
          </div>
          <div>
            <span className="text-gray-600">التقدم: </span>
            <span className="text-xl ml-2">{currentTarget + 1} / {points.length}</span>
          </div>
          <div>
            <span className="text-gray-600">الأخطاء: </span>
            <span className="text-xl text-red-600 ml-2">{errors}</span>
          </div>
        </div>

        {/* Game Canvas */}
        <div 
          ref={canvasRef}
          className="relative bg-white rounded-2xl shadow-xl"
          style={{ width: '600px', height: '600px', margin: '0 auto' }}
        >
          {/* Draw connecting lines */}
          <svg className="absolute inset-0 pointer-events-none" width="600" height="600">
            {path.map((point, index) => {
              if (index === 0) return null;
              return (
                <line
                  key={index}
                  x1={path[index - 1].x}
                  y1={path[index - 1].y}
                  x2={point.x}
                  y2={point.y}
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                />
              );
            })}
          </svg>

          {/* Draw points */}
          {points.map((point, index) => (
            <button
              key={point.id}
              onClick={() => handlePointClick(index)}
              disabled={point.completed}
              className={`
                absolute w-16 h-16 rounded-full
                flex items-center justify-center
                text-xl transition-all duration-200
                transform -translate-x-1/2 -translate-y-1/2
                ${point.completed 
                  ? 'bg-green-500 text-white scale-90 cursor-not-allowed'
                  : index === currentTarget
                    ? 'bg-orange-500 text-white scale-110 shadow-2xl ring-4 ring-orange-200 animate-pulse'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }
              `}
              style={{ left: `${point.x}px`, top: `${point.y}px` }}
            >
              {point.label}
            </button>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 text-center max-w-md mx-auto">
          <p className="text-gray-700">
            {testType === 'A' 
              ? 'اضغط على الأرقام بالترتيب من 1 إلى 15'
              : 'بدّل بين الأرقام والحروف (1 → أ → 2 → ب → 3 → ج ...)'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
