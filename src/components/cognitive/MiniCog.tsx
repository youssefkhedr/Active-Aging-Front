import { useState } from 'react';
import { Brain, CheckCircle2, ArrowLeft } from 'lucide-react';
import { assessmentService } from '../../services/assessment.service';

interface MiniCogProps {
  onBack: () => void;
}

type TestPhase = 'intro' | 'registration' | 'clock-draw' | 'recall' | 'results';

const PHASES_TITLES = {
  'registration': 'تسجيل الكلمات',
  'clock-draw': 'رسم الساعة',
  'recall': 'الاستدعاء'
};

const THREE_WORDS = ['موز', 'شروق', 'كرسي'];

export function MiniCog({ onBack }: MiniCogProps) {
  const [phase, setPhase] = useState<TestPhase>('intro');
  const [selectedRecallIndex, setSelectedRecallIndex] = useState<number | null>(null);
  const [clockScore, setClockScore] = useState<'normal' | 'abnormal' | null>(null);

  const recallOptions = [
    { words: ['موز', 'شروق', 'كرسي'], correct: true },
    { words: ['تفاحة', 'قمر', 'طاولة'], correct: false },
    { words: ['سيارة', 'شمس', 'كتاب'], correct: false },
  ];

  /* ================= SCORING ================= */
  const calculateScore = () => {
    const isCorrectRecall = selectedRecallIndex !== null && recallOptions[selectedRecallIndex].correct;
    const recallCount = isCorrectRecall ? 3 : 0;

    if (recallCount === 3)
      return { status: 'pass', interpretation: 'طبيعي - لا يوجد مؤشر على ضعف معرفي' };

    if (clockScore === 'normal')
      return { status: 'pass', interpretation: 'طبيعي - أداء مقبول' };

    return { status: 'fail', interpretation: 'احتمال ضعف معرفي - يُنصح بالتقييم الطبي' };
  };

  const completeTest = async () => {
    const isCorrectRecall = selectedRecallIndex !== null && recallOptions[selectedRecallIndex].correct;
    await assessmentService.createMiniCog({
      recallScore: isCorrectRecall ? 3 : 0,
      clockResult: clockScore || 'abnormal',
    });
    setPhase('results');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-6">
      <div className="max-w-4xl mx-auto">
        {phase !== 'intro' && phase !== 'results' && (
          <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold">{PHASES_TITLES[phase as keyof typeof PHASES_TITLES]}</h2>
            </div>
            <button onClick={onBack} className="p-2 hover:bg-white rounded-lg transition-colors border border-slate-200 bg-white shadow-sm">
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
          </div>
        )}

        {phase === 'intro' && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold mb-4">اختبار Mini-Cog</h1>
              <p className="text-gray-600 mb-10 text-lg leading-relaxed">
                اختبار لمدة ٣ دقائق يجمع بين تذكر الكلمات واختبار الساعة لتقييم القدرات الذهنية.
              </p>

              <div className="space-y-4 mb-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <div className="text-blue-600 font-bold text-lg mb-1">1</div>
                    <p className="text-sm font-medium">تسجيل الكلمات</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <div className="text-blue-600 font-bold text-lg mb-1">2</div>
                    <p className="text-sm font-medium">اختيار الساعة</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <div className="text-blue-600 font-bold text-lg mb-1">3</div>
                    <p className="text-sm font-medium">الاستدعاء</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setPhase('registration')} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-2xl shadow-2xl transform hover:scale-[1.03] transition-all">ابدأ الاختبار</button>
            </div>
          </div>
        )}

        {phase === 'registration' && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
              <h2 className="text-2xl font-bold mb-8">1️⃣ سجل هذه الكلمات في ذاكرتك</h2>
              <div className="space-y-4 mb-10">
                {THREE_WORDS.map((word, idx) => (
                  <div key={idx} className="bg-blue-50 p-6 rounded-2xl">
                    <p className="text-4xl font-black text-blue-700">{word}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setPhase('clock-draw')} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-2xl shadow-2xl transform hover:scale-[1.03] transition-all">التالي: اختبار الساعة</button>
            </div>
          </div>
        )}

        {phase === 'clock-draw' && (
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-4 text-center">2️⃣ اختر الساعة الصحيحة</h2>
            <p className="text-center text-gray-600 mb-8 font-medium">أي من هذه الساعات توضح الوقت 11:10 بشكل صحيح؟</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {/* Option 1: Scrambled Numbers (Wrong) */}
              <button
                onClick={() => { setClockScore('abnormal'); setPhase('recall'); }}
                className="p-6 border-4 border-gray-100 rounded-3xl hover:border-blue-200 transition-all group flex flex-col items-center bg-white"
              >
                <div className="w-full aspect-square bg-slate-50 rounded-2xl mb-4 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-32 h-32">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="2" />
                    <text x="50" y="20" fontSize="8" textAnchor="middle" fontWeight="bold">1</text>
                    <text x="80" y="50" fontSize="8" textAnchor="middle" fontWeight="bold">12</text>
                    <text x="50" y="80" fontSize="8" textAnchor="middle" fontWeight="bold">3</text>
                    <text x="20" y="50" fontSize="8" textAnchor="middle" fontWeight="bold">6</text>
                    <line x1="50" y1="50" x2="50" y2="25" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                    <line x1="50" y1="50" x2="65" y2="50" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="font-bold text-gray-500 group-hover:text-blue-600">الخيار أ</span>
              </button>

              {/* Option 2: Correct (11:10) */}
              <button
                onClick={() => { setClockScore('normal'); setPhase('recall'); }}
                className="p-6 border-4 border-gray-100 rounded-3xl hover:border-blue-500 hover:bg-blue-50 transition-all group flex flex-col items-center bg-white"
              >
                <div className="w-full aspect-square bg-blue-50/50 rounded-2xl mb-4 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-32 h-32">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="2" />
                    {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => {
                      const ang = (i * 30) * Math.PI / 180;
                      return <text key={n} x={50 + 35 * Math.sin(ang)} y={53 - 35 * Math.cos(ang)} fontSize="7" textAnchor="middle" fontWeight="bold" fill="#1e293b">{n}</text>
                    })}
                    {/* 11:10 hands */}
                    <line x1="50" y1="50" x2={50 + 25 * Math.sin(-30 * Math.PI / 180)} y2={50 - 25 * Math.cos(-30 * Math.PI / 180)} stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                    <line x1="50" y1="50" x2={50 + 35 * Math.sin(60 * Math.PI / 180)} y2={50 - 35 * Math.cos(60 * Math.PI / 180)} stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="3" fill="#1e293b" />
                  </svg>
                </div>
                <span className="font-bold text-gray-500 group-hover:text-blue-600">الخيار ب</span>
              </button>

              {/* Option 3: Wrong Hands (Wrong) */}
              <button
                onClick={() => { setClockScore('abnormal'); setPhase('recall'); }}
                className="p-6 border-4 border-gray-100 rounded-3xl hover:border-blue-200 transition-all group flex flex-col items-center bg-white"
              >
                <div className="w-full aspect-square bg-slate-50 rounded-2xl mb-4 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-32 h-32">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="2" />
                    {[12, 3, 6, 9].map((n, i) => {
                      const ang = (i * 90) * Math.PI / 180;
                      return <text key={n} x={50 + 35 * Math.sin(ang)} y={53 - 35 * Math.cos(ang)} fontSize="8" textAnchor="middle" fontWeight="bold" fill="#475569">{n}</text>
                    })}
                    <line x1="50" y1="50" x2="50" y2="80" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                    <line x1="50" y1="50" x2="80" y2="50" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="font-bold text-gray-500 group-hover:text-blue-600">الخيار ج</span>
              </button>
            </div>
          </div>
        )}

        {phase === 'recall' && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
              <h2 className="text-2xl font-bold mb-8">3️⃣ استدعاء الكلمات</h2>
              <p className="text-gray-600 mb-8 font-medium italic">ما هي الكلمات الثلاث التي طُلب منك حفظها؟</p>
              <div className="space-y-4 mb-10">
                {recallOptions.map((opt, idx) => (
                  <button key={idx} onClick={() => setSelectedRecallIndex(idx)} className={`w-full p-6 rounded-2xl border-2 transition-all text-2xl font-bold ${selectedRecallIndex === idx ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-lg' : 'border-gray-100 bg-white hover:border-blue-200'}`}>
                    {opt.words.join(' - ')}
                  </button>
                ))}
              </div>
              <button onClick={completeTest} disabled={selectedRecallIndex === null} className={`w-full py-5 rounded-2xl font-black text-2xl shadow-2xl transition-all transform ${selectedRecallIndex !== null ? 'bg-blue-600 text-white hover:scale-[1.03]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>إنهاء الاختبار</button>
            </div>
          </div>
        )}

        {phase === 'results' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
              <div className={`w-24 h-24 bg-${calculateScore().status === 'pass' ? 'green' : 'orange'}-100 rounded-full flex items-center justify-center mx-auto mb-6`}>
                <CheckCircle2 className={`w-14 h-14 text-${calculateScore().status === 'pass' ? 'green' : 'orange'}-600`} />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-slate-800">نتيجة MINI-COG</h1>
              <div className={`inline-block px-8 py-3 rounded-full bg-${calculateScore().status === 'pass' ? 'green' : 'orange'}-100 text-${calculateScore().status === 'pass' ? 'green' : 'orange'}-800 font-black text-2xl mb-8`}>
                {calculateScore().status === 'pass' ? 'طبيعي' : 'احتمال ضعف معرفي'}
              </div>
              <p className="text-lg text-gray-600 mb-12 leading-relaxed">{calculateScore().interpretation}</p>
              <button onClick={onBack} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:bg-blue-700 transition-all">العودة للرئيسية</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
