import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Zap, Trophy } from 'lucide-react';
import { saveGameResult } from '../../utils/storage';

interface ReactionTestProps {
  onBack: () => void;
}

type GameState = 'intro' | 'waiting' | 'ready' | 'clicked' | 'tooEarly' | 'finished';

export function ReactionTest({ onBack }: ReactionTestProps) {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [attempt, setAttempt] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [currentStartTime, setCurrentStartTime] = useState(0);
  const totalAttempts = 5;
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startRound = () => {
    setGameState('waiting');
    const delay = 2000 + Math.random() * 3000; // Random delay between 2-5 seconds

    timeoutRef.current = window.setTimeout(() => {
      setCurrentStartTime(Date.now());
      setGameState('ready');
    }, delay);
  };

  const handleClick = () => {
    if (gameState === 'waiting') {
      setGameState('tooEarly');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    if (gameState === 'ready') {
      const reactionTime = Date.now() - currentStartTime;
      const newReactionTimes = [...reactionTimes, reactionTime];
      setReactionTimes(newReactionTimes);

      if (attempt + 1 >= totalAttempts) {
        finishGame(newReactionTimes);
      } else {
        setAttempt(attempt + 1);
        setGameState('clicked');
      }
    }
  };

  const finishGame = (times: number[]) => {
    const avgReactionTime = times.reduce((a, b) => a + b, 0) / times.length;
    const bestTime = Math.min(...times);

    saveGameResult({
      gameType: 'reaction',
      score: bestTime,
      maxScore: 0,
      accuracy: 100,
      avgReactionTime,
      timestamp: Date.now(),
    });

    setGameState('finished');
  };

  const resetGame = () => {
    setAttempt(0);
    setReactionTimes([]);
    setGameState('intro');
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
              <Zap className="w-12 h-12 text-yellow-500" />
              <h1 className="text-3xl">اختبار سرعة الاستجابة</h1>
            </div>

            <div className="space-y-4 mb-8 text-gray-700">
              <p>
                هذا الاختبار يقيس سرعة استجابتك الحركية-العصبية (Reaction Time).
              </p>

              <div className="bg-yellow-50 border-r-4 border-yellow-500 p-4 rounded">
                <h3 className="mb-2">كيفية اللعب:</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>اضغط على "ابدأ الاختبار"</li>
                  <li>انتظر حتى يتحول اللون من الأحمر إلى الأخضر</li>
                  <li>بمجرد ظهور اللون الأخضر، اضغط بأسرع ما يمكن</li>
                  <li>لا تضغط قبل ظهور اللون الأخضر!</li>
                  <li>ستكرر الاختبار {totalAttempts} مرات</li>
                </ol>
              </div>

              <div className="bg-blue-50 p-4 rounded">
                <h3 className="mb-2">نصائح:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>ركز على الشاشة</li>
                  <li>ضع إصبعك جاهزاً للضغط</li>
                  <li>حاول الاسترخاء وعدم التوتر</li>
                </ul>
              </div>
            </div>

            <button
              onClick={startRound}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              ابدأ الاختبار
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const avgReactionTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    const bestTime = Math.min(...reactionTimes);
    const worstTime = Math.max(...reactionTimes);

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
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
            <h1 className="text-3xl mb-6">نتائج الاختبار</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                <p className="text-gray-600 mb-2">أفضل زمن</p>
                <p className="text-3xl text-green-600">{bestTime}ms</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                <p className="text-gray-600 mb-2">متوسط الزمن</p>
                <p className="text-3xl text-blue-600">{avgReactionTime.toFixed(0)}ms</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">
                <p className="text-gray-600 mb-2">أبطأ زمن</p>
                <p className="text-3xl text-orange-600">{worstTime}ms</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="mb-4">جميع المحاولات:</h3>
              <div className="space-y-2">
                {reactionTimes.map((time, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-gray-600">المحاولة {index + 1}</span>
                    <span className="text-xl">{time}ms</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  resetGame();
                  startRound();
                }}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
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

  if (gameState === 'tooEarly') {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <h2 className="text-3xl mb-4 text-red-600">مبكر جداً!</h2>
            <p className="text-xl text-gray-600 mb-8">
              انتظر حتى يتحول اللون إلى الأخضر
            </p>
            <button
              onClick={startRound}
              className="py-4 px-8 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              حاول مرة أخرى
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'clicked') {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <h2 className="text-3xl mb-4 text-green-600">رائع!</h2>
            <p className="text-2xl text-gray-600 mb-2">
              زمن الاستجابة: {reactionTimes[reactionTimes.length - 1]}ms
            </p>
            <p className="text-gray-500 mb-8">
              المحاولة {attempt} من {totalAttempts}
            </p>
            <button
              onClick={startRound}
              className="py-4 px-8 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              المحاولة التالية
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <button
        onPointerDown={handleClick}
        style={{ touchAction: 'manipulation' }}
        className={`
          w-full max-w-2xl aspect-square rounded-2xl shadow-2xl
          flex flex-col items-center justify-center
          transition-all duration-300 cursor-pointer
          ${gameState === 'waiting'
            ? 'bg-gradient-to-br from-red-500 to-red-600'
            : 'bg-gradient-to-br from-green-500 to-green-600'
          }
          transform active:scale-95
        `}
      >
        <div className="text-white text-center">
          {gameState === 'waiting' ? (
            <>
              <p className="text-3xl mb-4">انتظر...</p>
              <p className="text-xl opacity-80">المحاولة {attempt + 1} من {totalAttempts}</p>
            </>
          ) : (
            <>
              <Zap className="w-24 h-24 mb-6 mx-auto" />
              <p className="text-4xl mb-4">اضغط الآن!</p>
              <p className="text-xl opacity-80">المحاولة {attempt + 1} من {totalAttempts}</p>
            </>
          )}
        </div>
      </button>
    </div >
  );
}
