import { useState } from 'react';
import { ArrowLeft, Trophy, Brain } from 'lucide-react';
import { saveGameResult } from '../../utils/storage';

interface MemoryTestProps {
  onBack: () => void;
}

type GamePhase = 'intro' | 'memorize' | 'recall' | 'result' | 'finished';

interface Card {
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const symbols = ['🌟', '🎨', '🎭', '🎪', '🎯', '🎸', '🎹', '🎺'];

export function MemoryTest({ onBack }: MemoryTestProps) {
  const [gamePhase, setGamePhase] = useState<GamePhase>('intro');
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [level, setLevel] = useState(1);

  const pairsCount = 4 + level;

  const initializeGame = () => {
    const selectedSymbols = symbols.slice(0, pairsCount);
    const cardPairs = [...selectedSymbols, ...selectedSymbols];

    const shuffled = cardPairs
      .sort(() => Math.random() - 0.5)
      .map(value => ({
        value,
        isFlipped: true,
        isMatched: false,
      }));

    setCards(shuffled);
    setSelectedCards([]);
    setMoves(0);
    setMatches(0);
    setStartTime(Date.now());
    setGamePhase('memorize');

    setTimeout(() => {
      setCards(prev => prev.map(card => ({ ...card, isFlipped: false })));
      setGamePhase('recall');
    }, 3000);
  };

  const handleCardClick = (index: number) => {
    if (gamePhase !== 'recall') return;
    if (selectedCards.length === 2) return;
    if (selectedCards.includes(index)) return;
    if (cards[index].isMatched) return;

    setCards(prev =>
      prev.map((card, i) =>
        i === index ? { ...card, isFlipped: true } : card
      )
    );

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves(prev => prev + 1);

      const [first, second] = newSelected;

      if (cards[first].value === cards[second].value) {
        setTimeout(() => {
          setCards(prev =>
            prev.map((card, i) =>
              i === first || i === second
                ? { ...card, isMatched: true, isFlipped: true }
                : card
            )
          );
          setMatches(prev => prev + 1);
          setSelectedCards([]);

          if (matches + 1 === pairsCount) {
            const timeTaken = Date.now() - startTime;
            setGameTime(timeTaken);
            setGamePhase('result');
          }
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev =>
            prev.map((card, i) =>
              i === first || i === second
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  const finishGame = () => {
    const accuracy = moves ? (matches / moves) * 100 : 0;

    saveGameResult({
      gameType: 'memory',
      score: matches,
      maxScore: pairsCount,
      accuracy,
      avgReactionTime: moves ? gameTime / moves : 0,
      timestamp: Date.now(),
    });

    setGamePhase('finished');
  };

  if (gamePhase === 'result') {
    setTimeout(finishGame, 1000);
  }

  const gridSize = pairsCount <= 6 ? 4 : pairsCount <= 8 ? 4 : 5;

  /* ================= UI ================= */

  if (gamePhase === 'intro') {
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
              <Brain className="w-12 h-12 text-blue-500" />
              <h1 className="text-3xl">اختبار الذاكرة</h1>
            </div>

            <div className="space-y-4 mb-8 text-gray-700">
              <p>
                هذا الاختبار يقيس الذاكرة العاملة (Working Memory) والانتباه البصري.
              </p>

              <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded">
                <h3 className="mb-2">كيفية اللعب:</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>ستظهر لك مجموعة من البطاقات لمدة 3 ثوانٍ</li>
                  <li>احفظ مواقع الرموز المتطابقة</li>
                  <li>بعد إخفاء البطاقات، اضغط على بطاقتين متطابقتين</li>
                  <li>حاول إنهاء اللعبة بأقل عدد من المحاولات</li>
                </ol>
              </div>

              <div className="bg-purple-50 p-4 rounded">
                <h3 className="mb-2">المستوى الحالي: {level}</h3>
                <p>عدد الأزواج: {pairsCount}</p>
              </div>
            </div>

            <button
              onClick={initializeGame}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              ابدأ الاختبار
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'finished') {
    const accuracy = matches > 0 ? (matches / moves) * 100 : 0;
    const timeInSeconds = (gameTime / 1000).toFixed(1);

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
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                <p className="text-gray-600 mb-2">المحاولات</p>
                <p className="text-3xl text-blue-600">{moves}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                <p className="text-gray-600 mb-2">الدقة</p>
                <p className="text-3xl text-green-600">{accuracy.toFixed(1)}%</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                <p className="text-gray-600 mb-2">الوقت</p>
                <p className="text-3xl text-purple-600">{timeInSeconds}s</p>
              </div>
            </div>

            <div className="space-y-4">
              {accuracy > 80 && (
                <div className="bg-green-50 border-2 border-green-500 p-4 rounded-xl mb-4">
                  <p className="text-green-700">🎉 أداء ممتاز! يمكنك الانتقال للمستوى التالي</p>
                  <button
                    onClick={() => {
                      setLevel(level + 1);
                      setGamePhase('intro');
                    }}
                    className="mt-3 py-2 px-6 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    المستوى التالي
                  </button>
                </div>
              )}

              <button
                onClick={() => setGamePhase('intro')}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
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

  if (gamePhase === 'result') {
    setTimeout(finishGame, 1500);
  }



  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Stats Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex justify-between items-center">
          <div className="text-center">
            <p className="text-gray-600 text-sm">المحاولات</p>
            <p className="text-2xl">{moves}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm">الأزواج</p>
            <p className="text-2xl">{matches}/{pairsCount}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm">المستوى</p>
            <p className="text-2xl">{level}</p>
          </div>
        </div>

        {gamePhase === 'memorize' && (
          <div className="text-center mb-6">
            <p className="text-2xl text-blue-600 animate-pulse">احفظ مواقع البطاقات...</p>
          </div>
        )}

        {/* Cards Grid */}
        <div
          className="grid gap-4 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            maxWidth: `${gridSize * 120}px`
          }}
        >
          {cards.map((card, index) => (
            <button
              key={index}
              onClick={() => handleCardClick(index)}
              disabled={gamePhase === 'memorize' || card.isMatched}
              className={`
                aspect-square rounded-xl shadow-lg
                flex items-center justify-center text-4xl
                transition-all duration-300 transform
                ${card.isFlipped || card.isMatched || gamePhase === 'memorize'
                  ? 'bg-white scale-100'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:scale-105'
                }
                ${card.isMatched ? 'opacity-50' : ''}
                ${gamePhase === 'recall' && !card.isMatched ? 'cursor-pointer' : ''}
              `}
            >
              {(card.isFlipped || card.isMatched || gamePhase === 'memorize') && card.value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}