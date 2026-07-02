import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Clock } from 'lucide-react';
import { saveGameResult } from '../../utils/storage';
import { StroopResults } from '../cognitive/StroopResults';

interface StroopTestProps {
  onBack: () => void;
}

type Color = 'red' | 'blue' | 'green' | 'yellow';

const colors: Color[] = ['red', 'blue', 'green', 'yellow'];
const colorNames: Record<Color, string> = {
  red: 'أحمر',
  blue: 'أزرق',
  green: 'أخضر',
  yellow: 'أصفر',
};

const colorClasses: Record<Color, string> = {
  red: 'text-red-600',
  blue: 'text-blue-600',
  green: 'text-green-600',
  yellow: 'text-yellow-600',
};

export function StroopTest({ onBack }: StroopTestProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [wordColor, setWordColor] = useState<Color>('red');
  const [textColor, setTextColor] = useState<Color>('blue');
  const [startTime, setStartTime] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [correctness, setCorrectness] = useState<boolean[]>([]);
  const [roundsTotal] = useState(15);

  useEffect(() => {
    if (gameState === 'playing') {
      generateNewRound();
    }
  }, [gameState]);

  const generateNewRound = () => {
    const newWordColor = colors[Math.floor(Math.random() * colors.length)];
    const newTextColor = colors[Math.floor(Math.random() * colors.length)];
    setWordColor(newWordColor);
    setTextColor(newTextColor);
    setStartTime(Date.now());
  };

  const handleAnswer = (selectedColor: Color) => {
    const reactionTime = (Date.now() - startTime) / 1000; // Convert to seconds
    const isCorrect = selectedColor === textColor;

    if (isCorrect) {
      setScore(score + 1);
    }

    setReactionTimes([...reactionTimes, reactionTime]);
    setTimestamps([...timestamps, Date.now()]);
    setCorrectness([...correctness, isCorrect]);

    if (currentRound + 1 >= roundsTotal) {
      finishGame(
        isCorrect ? score + 1 : score, 
        [...reactionTimes, reactionTime],
        [...timestamps, Date.now()],
        [...correctness, isCorrect]
      );
    } else {
      setCurrentRound(currentRound + 1);
      generateNewRound();
    }
  };

  const finishGame = (finalScore: number, allReactionTimes: number[], allTimestamps: number[], allCorrectness: boolean[]) => {
    const avgReactionTime = allReactionTimes.reduce((a, b) => a + b, 0) / allReactionTimes.length;
    const accuracy = (finalScore / roundsTotal) * 100;

    saveGameResult({
      gameType: 'stroop',
      score: finalScore,
      maxScore: roundsTotal,
      accuracy,
      avgReactionTime,
      timestamp: Date.now(),
    });

    setGameState('finished');
  };

  const startGame = () => {
    setGameState('playing');
    setCurrentRound(0);
    setScore(0);
    setReactionTimes([]);
    setTimestamps([]);
    setCorrectness([]);
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
            <h1 className="text-3xl mb-6">اختبار ستروب</h1>
            
            <div className="space-y-4 mb-8 text-gray-700">
              <p>
                اختبار ستروب يقيس قدرتك على التحكم المثبط (Inhibitory Control) وسرعة المعالجة المعرفية.
              </p>
              
              <div className="bg-purple-50 border-r-4 border-purple-500 p-4 rounded">
                <h3 className="mb-2">كيفية اللعب:</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>ستظهر لك كلمة لون مكتوبة بلون معين</li>
                  <li>اختر <strong>لون النص</strong> وليس معنى الكلمة</li>
                  <li>على سبيل المثال: إذا كانت كلمة "أحمر" مكتوبة باللون الأزرق، اختر "أزرق"</li>
                  <li>حاول الإجابة بأسرع وأدق ما يمكن</li>
                </ol>
              </div>

              <div className="bg-blue-50 p-4 rounded">
                <h3 className="mb-2">مثال توضيحي:</h3>
                <div className="text-center my-4">
                  <p className="text-4xl text-green-600 mb-4">أحمر</p>
                  <p className="text-gray-600">الإجابة الصحيحة: <strong>أخضر</strong> (لون النص)</p>
                </div>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              ابدأ الاختبار
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const accuracy = (score / roundsTotal) * 100;
    const avgReactionTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;

    return (
      <StroopResults 
        onBack={onBack}
        results={{
          totalScore: score,
          maxScore: roundsTotal,
          correctAnswers: score,
          wrongAnswers: roundsTotal - score,
          totalQuestions: roundsTotal,
          accuracy,
          avgResponseTime: avgReactionTime,
          responseTimes: reactionTimes,
          timestamps,
          correctness,
        }}
      />
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">الجولة {currentRound + 1} من {roundsTotal}</span>
            <span className="text-gray-600">النتيجة: {score}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
              style={{ width: `${((currentRound + 1) / roundsTotal) * 100}%` }}
            />
          </div>
        </div>

        {/* Game Card */}
        <div className="bg-white rounded-2xl shadow-xl p-12">
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-4">اختر لون النص (وليس معنى الكلمة):</p>
            <p className={`text-7xl ${colorClasses[textColor]} select-none`}>
              {colorNames[wordColor]}
            </p>
          </div>

          {/* Answer Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => handleAnswer(color)}
                className={`
                  py-6 px-8 rounded-xl shadow-lg
                  transform transition-all duration-200
                  hover:scale-105 hover:shadow-xl
                  ${color === 'red' ? 'bg-red-500 hover:bg-red-600' : ''}
                  ${color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                  ${color === 'green' ? 'bg-green-500 hover:bg-green-600' : ''}
                  ${color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                  text-white text-xl
                `}
              >
                {colorNames[color]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}