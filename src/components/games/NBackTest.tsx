import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Brain, Trophy } from 'lucide-react';
import { saveGameResult } from '../../utils/storage';

interface NBackTestProps {
  onBack: () => void;
}

type GameState = 'intro' | 'playing' | 'finished';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L', 'M', 'N'];
const COLORS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500'];

export function NBackTest({ onBack }: NBackTestProps) {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [nLevel, setNLevel] = useState(2); // 2-back
  const [sequence, setSequence] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userResponses, setUserResponses] = useState<boolean[]>([]);
  const [correctMatches, setCorrectMatches] = useState<boolean[]>([]);
  const [score, setScore] = useState({ correct: 0, incorrect: 0, missed: 0 });
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const sequenceLength = 20;
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState === 'playing' && currentIndex < sequence.length) {
      intervalRef.current = window.setTimeout(() => {
        // Check if user should have responded but didn't
        if (correctMatches[currentIndex] && !userResponses[currentIndex]) {
          setScore(prev => ({ ...prev, missed: prev.missed + 1 }));
        }
        setCurrentIndex(currentIndex + 1);
      }, 2500); // 2.5 seconds per letter

      return () => {
        if (intervalRef.current) clearTimeout(intervalRef.current);
      };
    } else if (gameState === 'playing' && currentIndex >= sequence.length) {
      finishGame();
    }
  }, [gameState, currentIndex]);

  const generateSequence = (n: number) => {
    const seq: string[] = [];
    const matches: boolean[] = [];
    
    // Generate sequence with some n-back matches
    for (let i = 0; i < sequenceLength; i++) {
      if (i >= n && Math.random() < 0.3) {
        // 30% chance of match
        seq.push(seq[i - n]);
        matches.push(true);
      } else {
        // Random letter that doesn't match n positions back
        let letter;
        do {
          letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        } while (i >= n && letter === seq[i - n]);
        seq.push(letter);
        matches.push(false);
      }
    }

    setSequence(seq);
    setCorrectMatches(matches);
    setUserResponses(new Array(sequenceLength).fill(false));
  };

  const startGame = () => {
    generateSequence(nLevel);
    setCurrentIndex(0);
    setScore({ correct: 0, incorrect: 0, missed: 0 });
    setShowFeedback(null);
    setGameState('playing');
  };

  const handleResponse = () => {
    if (currentIndex >= sequence.length) return;

    const newResponses = [...userResponses];
    newResponses[currentIndex] = true;
    setUserResponses(newResponses);

    if (correctMatches[currentIndex]) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      setShowFeedback('correct');
    } else {
      setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
      setShowFeedback('incorrect');
    }

    setTimeout(() => setShowFeedback(null), 500);
  };

  const finishGame = () => {
    const totalMatches = correctMatches.filter(m => m).length;
    const accuracy = totalMatches > 0 
      ? (score.correct / totalMatches) * 100 
      : 0;

    saveGameResult({
      gameType: 'memory',
      score: score.correct,
      maxScore: totalMatches,
      accuracy,
      avgReactionTime: 2500,
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
              <Brain className="w-12 h-12 text-purple-500" />
              <div>
                <h1 className="text-3xl">اختبار N-Back</h1>
                <p className="text-gray-600">N-Back Task - Working Memory</p>
              </div>
            </div>

            <div className="space-y-4 mb-8 text-gray-700">
              <p>
                اختبار N-Back يقيس الذاكرة العاملة (Working Memory) وقدرتك ��لى تذكر المعلومات 
                والتعامل معها بشكل مستمر.
              </p>

              <div className="bg-purple-50 border-r-4 border-purple-500 p-4 rounded">
                <h3 className="mb-2">كيفية اللعب:</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>ستظهر لك سلسلة من الحروف، واحد تلو الآخر</li>
                  <li>عليك الضغط على "تطابق" عندما يكون الحرف الحالي مطابقاً للحرف الذي ظهر قبله بـ {nLevel} خطوات</li>
                  <li>على سبيل المثال في {nLevel}-Back: إذا كان الحرف الحالي "A" والحرف قبل {nLevel} خطوات "A"، اضغط "تطابق"</li>
                  <li>لا تضغط على شيء إذا لم يكن هناك تطابق</li>
                </ol>
              </div>

              <div className="bg-blue-50 p-4 rounded">
                <h3 className="mb-2">مستوى الصعوبة:</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setNLevel(1)}
                    className={`px-4 py-2 rounded-lg ${
                      nLevel === 1 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border-2 border-blue-200'
                    }`}
                  >
                    1-Back (سهل)
                  </button>
                  <button
                    onClick={() => setNLevel(2)}
                    className={`px-4 py-2 rounded-lg ${
                      nLevel === 2 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border-2 border-blue-200'
                    }`}
                  >
                    2-Back (متوسط)
                  </button>
                  <button
                    onClick={() => setNLevel(3)}
                    className={`px-4 py-2 rounded-lg ${
                      nLevel === 3 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border-2 border-blue-200'
                    }`}
                  >
                    3-Back (صعب)
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border-r-4 border-yellow-500 p-4 rounded">
                <h3 className="mb-2">مثال توضيحي (2-Back):</h3>
                <div className="font-mono text-center text-2xl mb-3">
                  A → B → A → C → B
                </div>
                <p className="text-sm">
                  • عند ظهور الحرف الثالث "A"، يجب الضغط لأنه يطابق الحرف الأول
                  <br />
                  • عند ظهور الحرف الخامس "B"، يجب الضغط لأنه يطابق الحرف الثاني
                </p>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              ابدأ الاختبار ({nLevel}-Back)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const totalMatches = correctMatches.filter(m => m).length;
    const accuracy = totalMatches > 0 ? (score.correct / totalMatches) * 100 : 0;

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
            <Trophy className="w-20 h-20 text-purple-500 mx-auto mb-6" />
            <h1 className="text-3xl mb-2">نتائج الاختبار</h1>
            <p className="text-gray-600 mb-8">{nLevel}-Back Task</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                <p className="text-gray-600 mb-2">إجابات صحيحة</p>
                <p className="text-4xl text-green-600">{score.correct}</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl">
                <p className="text-gray-600 mb-2">أخطاء</p>
                <p className="text-4xl text-red-600">{score.incorrect}</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl">
                <p className="text-gray-600 mb-2">فائتة</p>
                <p className="text-4xl text-yellow-600">{score.missed}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl mb-8">
              <p className="text-gray-600 mb-2">الدقة</p>
              <p className="text-5xl text-purple-600">{accuracy.toFixed(1)}%</p>
              <p className="text-sm text-gray-600 mt-2">
                {score.correct} من {totalMatches} تطابقات
              </p>
            </div>

            <div className={`
              p-4 rounded-xl mb-6
              ${accuracy >= 80 ? 'bg-green-50 border-2 border-green-500' : ''}
              ${accuracy >= 60 && accuracy < 80 ? 'bg-blue-50 border-2 border-blue-500' : ''}
              ${accuracy < 60 ? 'bg-yellow-50 border-2 border-yellow-500' : ''}
            `}>
              <h3 className="mb-2">التقييم:</h3>
              <p className="text-gray-700">
                {accuracy >= 80 && '🎉 ممتاز! ذاكرتك العاملة في حالة جيدة جداً'}
                {accuracy >= 60 && accuracy < 80 && '👍 جيد! استمر في التدريب لتحسين الأداء'}
                {accuracy < 60 && nLevel > 1 && '💡 جرب مستوى أسهل أولاً، ثم تقدم تدريجياً'}
                {accuracy < 60 && nLevel === 1 && '💪 لا تقلق، الذاكرة العاملة تتحسن مع التدريب المنتظم'}
              </p>
            </div>

            <div className="space-y-4">
              {accuracy >= 75 && nLevel < 3 && (
                <button
                  onClick={() => {
                    setNLevel(nLevel + 1);
                    setGameState('intro');
                  }}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  انتقل للمستوى الأصعب ({nLevel + 1}-Back)
                </button>
              )}

              <button
                onClick={startGame}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
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
  const currentLetter = sequence[currentIndex] || '';
  const colorClass = COLORS[currentIndex % COLORS.length];
  const progress = ((currentIndex + 1) / sequence.length) * 100;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">{currentIndex + 1} / {sequence.length}</span>
            <span className="text-gray-600">
              صحيحة: {score.correct} | خاطئة: {score.incorrect}
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Letter Display */}
        <div className={`
          relative bg-white rounded-2xl shadow-2xl p-16 mb-8 
          ${showFeedback === 'correct' ? 'ring-8 ring-green-400' : ''}
          ${showFeedback === 'incorrect' ? 'ring-8 ring-red-400' : ''}
          transition-all duration-300
        `}>
          <div className="text-center">
            <div className={`
              inline-flex items-center justify-center
              w-48 h-48 rounded-3xl ${colorClass}
              text-white text-8xl
              shadow-2xl
              transform transition-transform duration-300
              ${showFeedback ? 'scale-110' : 'scale-100'}
            `}>
              {currentLetter}
            </div>
          </div>
        </div>

        {/* Hint */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-center">
          <p className="text-gray-700">
            هل الحرف الحالي <strong>{currentLetter}</strong> يطابق الحرف قبل <strong>{nLevel}</strong> خطوات؟
          </p>
          {currentIndex >= nLevel && (
            <p className="text-sm text-gray-600 mt-2">
              الحرف قبل {nLevel} خطوات كان: <strong>{sequence[currentIndex - nLevel]}</strong>
            </p>
          )}
        </div>

        {/* Response Button */}
        <button
          onClick={handleResponse}
          disabled={userResponses[currentIndex]}
          className={`
            w-full py-6 text-2xl rounded-xl shadow-xl
            transform transition-all duration-200
            ${userResponses[currentIndex]
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:scale-105 hover:shadow-2xl'
            }
          `}
        >
          {userResponses[currentIndex] ? '✓ تم التسجيل' : 'تطابق! 🎯'}
        </button>

        <p className="text-center text-gray-500 mt-4 text-sm">
          لا تضغط على شيء إذا لم يكن هناك تطابق
        </p>
      </div>
    </div>
  );
}
