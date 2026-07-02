import { useState, useEffect } from 'react';
import { ArrowLeft, Brain, CheckCircle2, Watch, Pencil } from 'lucide-react';
import { assessmentService } from '../../services/assessment.service';

interface MMSEProps {
  onBack: () => void;
}

type TestPhase = 'intro' | 'orientation-time' | 'orientation-place' | 'registration' | 'attention' | 'recall' | 'language-naming' | 'language-repetition' | 'language-drawing' | 'results';

interface Answer {
  question: string;
  answer: string | boolean;
  correct: boolean;
  points: number;
}

const PHASES_TITLES: Record<string, string> = {
  'orientation-time': 'التوجه الزماني',
  'orientation-place': 'التوجه المكاني',
  'registration': 'تسجيل الكلمات',
  'attention': 'الانتباه والحساب',
  'recall': 'الاستدعاء',
  'language-naming': 'التسمية',
  'language-repetition': 'التكرار',
  'language-drawing': 'الرسم'
};

interface PhaseProps {
  onNext: (points: number, answerDetail: Answer) => void;
  onBack?: () => void;
}

/* ================== PHASES ================== */

const IntroPhase = ({ onStart, onBack }: { onStart: () => void; onBack: () => void }) => (
  <div className="min-h-screen p-6">
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 shadow-lg hover:shadow-xl transition-all mb-6">
        <ArrowLeft className="w-6 h-6 text-gray-700" />
      </button>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <Brain className="w-10 h-10 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl">اختبار MMSE</h1>
            <p className="text-gray-600">Mini-Mental State Examination</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-indigo-50 border-r-4 border-indigo-500 p-4 rounded">
            <h3 className="mb-2">🧠 ما هو MMSE؟</h3>
            <p className="text-gray-700 text-sm">
              MMSE هو أداة فحص معرفي شاملة مكونة من 30 نقطة تُستخدم لتقييم الوظائف المعرفية المختلفة.
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="mb-3">مجالات التقييم (30 نقطة):</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div>• <strong>التوجه:</strong> الزمان (5) + المكان (5)</div>
              <div>• <strong>الانتباه والحساب:</strong> العد التنازلي (5)</div>
              <div>• <strong>الاستدعاء:</strong> تذكر 3 كلمات (3)</div>
              <div>• <strong>اللغة والتسمية:</strong> تحديد الأشياء (2)</div>
              <div>• <strong>التكرار والمعالجة:</strong> تذكر جملة (9)</div>
              <div>• <strong>الرسم:</strong> اختيار شكل (1)</div>
            </div>
          </div>
        </div>

        <button onClick={onStart} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-2xl shadow-2xl transform hover:scale-[1.03] transition-all">
          ابدأ الاختبار
        </button>
      </div>
    </div>
  </div>
);

const OrientationTimePhase = ({ onNext, onBack }: PhaseProps) => {
  const today = new Date();
  const [data, setData] = useState({ year: '', season: '', month: '', date: '', day: '' });

  const seasons = ['الشتاء', 'الربيع', 'الصيف', 'الخريف'];
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const weekdays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const handleSubmit = () => {
    let score = 0;
    if (parseInt(data.year) === today.getFullYear()) score++;
    if (data.month === today.toLocaleDateString('ar-EG', { month: 'long' })) score++;
    if (data.date === today.getDate().toString()) score++;
    if (data.day === today.toLocaleDateString('ar-EG', { weekday: 'long' })) score++;
    const monthIdx = today.getMonth();
    const correctSeason = seasons[Math.floor(monthIdx / 3) % 4];
    if (data.season === correctSeason) score++;

    onNext(score, {
      question: 'التوجه الزماني (5 نقاط)',
      answer: Object.values(data).join(', '),
      correct: score === 5,
      points: score
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
      {onBack && (
        <button onClick={onBack} className="mb-4 text-gray-500 hover:text-gray-700 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> رجوع
        </button>
      )}
      <h2 className="text-2xl mb-6">1️⃣ التوجه الزماني</h2>
      <div className="space-y-4 mb-8">
        <input type="number" placeholder="السنة" value={data.year} onChange={e => setData({ ...data, year: e.target.value })} className="w-full p-3 border rounded-lg" />
        <select value={data.season} onChange={e => setData({ ...data, season: e.target.value })} className="w-full p-3 border rounded-lg">
          <option value="">الفصل</option>
          {seasons.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={data.month} onChange={e => setData({ ...data, month: e.target.value })} className="w-full p-3 border rounded-lg">
          <option value="">الشهر</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="number" placeholder="اليوم (تاريخ)" value={data.date} onChange={e => setData({ ...data, date: e.target.value })} className="w-full p-3 border rounded-lg" />
        <select value={data.day} onChange={e => setData({ ...data, day: e.target.value })} className="w-full p-3 border rounded-lg">
          <option value="">يوم الأسبوع</option>
          {weekdays.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <button onClick={handleSubmit} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transform hover:scale-[1.02] transition-all">التالي</button>
    </div>
  );
};

const OrientationPlacePhase = ({ onNext }: PhaseProps) => {
  const [data, setData] = useState({ country: '', city: '', district: '', place: '', floor: '' });

  const handleSubmit = () => {
    let score = 0;
    if (data.country) score++;
    if (data.city) score++;
    if (data.district) score++;
    if (data.place) score++;
    if (data.floor) score++;

    onNext(score, {
      question: 'التوجه المكاني (5 نقاط)',
      answer: Object.values(data).join(', '),
      correct: score === 5,
      points: score
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl mb-6">2️⃣ التوجه المكاني</h2>
      <div className="space-y-4 mb-8">
        <input placeholder="البلد" value={data.country} onChange={e => setData({ ...data, country: e.target.value })} className="w-full p-3 border rounded-lg" />
        <input placeholder="المدينة/المحافظة" value={data.city} onChange={e => setData({ ...data, city: e.target.value })} className="w-full p-3 border rounded-lg" />
        <input placeholder="المنطقة/الحي" value={data.district} onChange={e => setData({ ...data, district: e.target.value })} className="w-full p-3 border rounded-lg" />
        <input placeholder="اسم المكان الحالي (مستشفى/منزل)" value={data.place} onChange={e => setData({ ...data, place: e.target.value })} className="w-full p-3 border rounded-lg" />
        <input placeholder="الطابق أو الغرفة" value={data.floor} onChange={e => setData({ ...data, floor: e.target.value })} className="w-full p-3 border rounded-lg" />
      </div>
      <button onClick={handleSubmit} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transform hover:scale-[1.02] transition-all">التالي</button>
    </div>
  );
}; // End of OrientationPlacePhase

const RegistrationPhase = ({ onNext }: PhaseProps) => {
  const words = ['تفاحة', 'طاولة', 'قرش'];
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto text-center">
      <h2 className="text-2xl mb-6">3️⃣ تسجيل الكلمات (3 نقاط)</h2>
      <p className="text-xl text-gray-700 mb-8">سأذكر لك 3 كلمات. أعد تكرارها الآن وحاول حفظها، سأسألك عنها لاحقاً:</p>
      <div className="flex justify-center gap-4 mb-10">
        {words.map((w, i) => (
          <div key={i} className="bg-indigo-50 px-8 py-6 rounded-2xl border-2 border-indigo-100">
            <p className="text-3xl font-black text-indigo-700">{w}</p>
          </div>
        ))}
      </div>
      <button
        onClick={() => onNext(3, { question: 'تسجيل الكلمات', answer: 'Registered', correct: true, points: 3 })}
        className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transform hover:scale-[1.02] transition-all"
      >
        حفظتها، التالي
      </button>
    </div>
  );
};

const AttentionPhase = ({ onNext }: PhaseProps) => {
  const [input, setInput] = useState('');
  const handleSubmit = () => {
    const sequence = [93, 86, 79, 72, 65];
    const userNums = input.split(/[\s,]+/).map(n => parseInt(n)).filter(n => !isNaN(n));
    let score = 0;
    userNums.forEach((n, i) => { if (i < 5 && n === sequence[i]) score++; });
    onNext(score, { question: 'الانتباه (طرح 7 متسلسل)', answer: input, correct: score === 5, points: score });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl mb-4">4️⃣ الانتباه والحساب</h2>
      <p className="mb-4 text-gray-700">اطرح 7 من 100 بشكل متسلسل (5 مرات). اكتب الأرقام:</p>
      <input placeholder="مثال: 93 86 ..." value={input} onChange={e => setInput(e.target.value)} className="w-full p-3 border rounded-lg mb-6" />
      <button onClick={handleSubmit} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transform hover:scale-[1.02] transition-all">التالي</button>
    </div>
  );
};

const RecallPhase = ({ onNext }: PhaseProps) => {
  const [selection, setSelection] = useState<string[]>([]);
  const targets = ['تفاحة', 'طاولة', 'قرش'];
  const options = ['تفاحة', 'سيارة', 'طاولة', 'كتاب', 'قرش', 'قلم'];

  const toggle = (w: string) => {
    if (selection.includes(w)) setSelection(selection.filter(x => x !== w));
    else if (selection.length < 3) setSelection([...selection, w]);
  };

  const handleSubmit = () => {
    let score = 0;
    targets.forEach(t => { if (selection.includes(t)) score++; });
    onNext(score, { question: 'الاستدعاء', answer: selection.join(', '), correct: score === 3, points: score });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto text-center">
      <h2 className="text-2xl mb-4">5️⃣ الاستدعاء</h2>
      <p className="mb-6 text-gray-700 text-lg">تذكر الكلمات الثلاث التي تم طرحها في مرحلة سابقة:</p>
      <div className="bg-indigo-50 p-4 rounded-xl mb-6 inline-block">
        <p className="text-indigo-600 text-sm">اختر ٣ كلمات فقط</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {options.map(w => {
          const isSelected = selection.includes(w);
          return (
            <button
              key={w}
              onClick={() => toggle(w)}
              className={`p-4 rounded-xl border-2 transition-all ${isSelected
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-100 bg-white text-gray-700 hover:border-indigo-200'
                }`}
            >
              <span className="font-bold">{w}</span>
            </button>
          );
        })}
      </div>
      <button onClick={handleSubmit} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transform hover:scale-[1.02] transition-all">التالي</button>
    </div>
  );
};

const NamingPhase = ({ onNext }: PhaseProps) => {
  const [answers, setAnswers] = useState({ watch: '', pencil: '' });
  const optionsMap = {
    watch: ['ساعة', 'خاتم', 'سوار'],
    pencil: ['قلم', 'مسطرة', 'فرشاة']
  };

  const score = (answers.watch === 'ساعة' ? 1 : 0) + (answers.pencil === 'قلم' ? 1 : 0);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto text-center">
      <h2 className="text-2xl mb-6">6️⃣ التسمية</h2>
      <div className="space-y-8">
        <div className="bg-gray-50 p-6 rounded-xl">
          <Watch className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
          <p className="mb-4 font-medium">ما هذا الشيء؟</p>
          <div className="flex justify-center gap-3">
            {optionsMap.watch.map(opt => (
              <button key={opt} onClick={() => setAnswers({ ...answers, watch: opt })} className={`px-6 py-2 rounded-full border-2 transition-all ${answers.watch === opt ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200'}`}>{opt}</button>
            ))}
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-xl">
          <Pencil className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
          <p className="mb-4 font-medium">ما هذا الشيء؟</p>
          <div className="flex justify-center gap-3">
            {optionsMap.pencil.map(opt => (
              <button key={opt} onClick={() => setAnswers({ ...answers, pencil: opt })} className={`px-6 py-2 rounded-full border-2 transition-all ${answers.pencil === opt ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200'}`}>{opt}</button>
            ))}
          </div>
        </div>
      </div>
      <button onClick={() => onNext(score, { question: 'التسمية', answer: `Watch:${answers.watch}, Pencil:${answers.pencil}`, correct: score === 2, points: score })} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transform hover:scale-[1.02] transition-all mt-8">التالي</button>
    </div>
  );
};

const RepetitionPhase = ({ onNext }: PhaseProps) => {
  const [step, setStep] = useState<'show' | 'choice'>('show');
  const sentence = "لا إذاً، ولا لكن، ولا لو";
  const options = [
    "لا إذاً، ولا لكن، ولا لو",
    "إذاً، لكن، لو فقط",
    "لا إذاً، ولا ربما، ولا لو",
    "نعم إذاً، ونعم لكن، ولو"
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto text-center">
      <h2 className="text-2xl mb-6">7️⃣ التكرار والمعالجة</h2>
      {step === 'show' ? (
        <div className="space-y-6">
          <p className="text-lg text-gray-700">اقرأ واحفظ هذه الجملة جيداً:</p>
          <div className="bg-indigo-50 p-8 rounded-2xl border-2 border-indigo-200">
            <p className="text-3xl font-bold text-indigo-900">"{sentence}"</p>
          </div>
          <button onClick={() => setStep('choice')} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transform hover:scale-[1.02] transition-all">حفظتها، التالي</button>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-lg text-gray-700">اختر الجملة الصحيحة التي قرأتها:</p>
          <div className="grid grid-cols-1 gap-4">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => onNext(opt === sentence ? 9 : 0, { question: 'التكرار', answer: opt, correct: opt === sentence, points: opt === sentence ? 9 : 0 })}
                className="p-6 rounded-2xl border-4 bg-white border-slate-200 text-slate-700 hover:border-indigo-600 hover:bg-slate-50 transition-all text-xl font-black shadow-md active:bg-indigo-600 active:text-white"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DrawingPhase = ({ onNext }: PhaseProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl mb-6 text-center">8️⃣ اختبار الرسم البصري</h2>
      <div className="space-y-6 mb-10">
        <div className="bg-blue-50 p-6 rounded-2xl text-center border-l-4 border-blue-500">
          <p className="text-gray-700 font-bold">أي من هذه الأشكال يمثل "تقاطع خماسي الأضلاع" بشكل صحيح؟</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Option 1: Wrong Shape (Squares) */}
          <button
            onClick={() => onNext(0, { question: 'الرسم', answer: 'Wrong Shape', correct: false, points: 0 })}
            className="p-6 border-4 border-gray-100 rounded-3xl hover:border-red-200 transition-all group flex flex-col items-center bg-white"
          >
            <div className="w-full aspect-square bg-slate-50 rounded-2xl mb-4 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-32 h-32">
                <rect x="20" y="20" width="40" height="40" fill="none" stroke="#64748b" strokeWidth="2" />
                <rect x="40" y="40" width="40" height="40" fill="none" stroke="#64748b" strokeWidth="2" />
              </svg>
            </div>
            <span className="font-bold text-gray-500">الخيار أ</span>
          </button>

          {/* Option 2: Correct (Pentagons) */}
          <button
            onClick={() => onNext(1, { question: 'الرسم', answer: 'Drawn Correctly', correct: true, points: 1 })}
            className="p-6 border-4 border-gray-100 rounded-3xl hover:border-red-200 transition-all group flex flex-col items-center bg-white"
          >
            <div className="w-full aspect-square bg-slate-50 rounded-2xl mb-4 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-32 h-32">
                <path d="M30 20 L50 10 L70 20 L65 45 L35 45 Z" fill="none" stroke="#64748b" strokeWidth="2" />
                <path d="M45 35 L65 25 L85 35 L80 60 L50 60 Z" fill="none" stroke="#64748b" strokeWidth="2" />
              </svg>
            </div>
            <span className="font-bold text-gray-500">الخيار ب</span>
          </button>

          {/* Option 3: No Intersection */}
          <button
            onClick={() => onNext(0, { question: 'الرسم', answer: 'No Intersection', correct: false, points: 0 })}
            className="p-6 border-4 border-gray-100 rounded-3xl hover:border-red-200 transition-all group flex flex-col items-center bg-white"
          >
            <div className="w-full aspect-square bg-slate-50 rounded-2xl mb-4 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-32 h-32">
                <path d="M10 20 L30 10 L50 20 L45 45 L15 45 Z" fill="none" stroke="#64748b" strokeWidth="2" />
                <path d="M55 50 L75 40 L95 50 L90 75 L60 75 Z" fill="none" stroke="#64748b" strokeWidth="2" />
              </svg>
            </div>
            <span className="font-bold text-gray-500">الخيار ج</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export function MMSE({ onBack }: MMSEProps) {
  const [phase, setPhase] = useState<TestPhase>('intro');
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [totalScore, setTotalScore] = useState(0);

  const handleNext = (phaseId: string, nextPhase: TestPhase, points: number, answerDetail: Answer) => {
    const newAnswers = { ...answers, [phaseId]: answerDetail };
    setAnswers(newAnswers);
    setTotalScore(prev => prev + points);
    setPhase(nextPhase);
  };

  useEffect(() => {
    if (phase === 'results') {
      const score = Object.values(answers).reduce((sum, a) => sum + a.points, 0);
      setTotalScore(score);

      const result = {
        timestamp: Date.now(),
        totalScore: score,
        maxScore: 30,
        answers,
        interpretation: getScoreInterpretation(score)
      };

      const save = async () => {
        try {
          const existing = localStorage.getItem('mmseResults');
          const list = existing ? JSON.parse(existing) : [];
          list.push(result);
          localStorage.setItem('mmseResults', JSON.stringify(list));
          await assessmentService.createMmse({ totalScore: score, rawData: answers, sectionScores: JSON.stringify(answers) });
        } catch (e) {
          console.error(e);
        }
      };
      save();
    }
  }, [phase]);

  const getScoreInterpretation = (score: number) => {
    if (score >= 24) return { level: 'طبيعي', levelEn: 'Normal', color: 'green', description: 'لا يوجد مؤشر على ضعف معرفي' };
    if (score >= 18) return { level: 'ضعف معرفي خفيف', levelEn: 'Mild Cognitive Impairment', color: 'yellow', description: 'يُنصح بالمتابعة الطبية' };
    if (score >= 10) return { level: 'ضعف معرفي متوسط', levelEn: 'Moderate Cognitive Impairment', color: 'orange', description: 'يحتاج تقييم طبي وتدخل' };
    return { level: 'ضعف معرفي شديد', levelEn: 'Severe Cognitive Impairment', color: 'red', description: 'يحتاج رعاية طبية عاجلة' };
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-6">
      <div className="max-w-4xl mx-auto">
        {phase !== 'intro' && phase !== 'results' && (
          <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{PHASES_TITLES[phase as keyof typeof PHASES_TITLES]}</h2>
            </div>
            <button onClick={onBack} className="p-2 hover:bg-white rounded-lg transition-colors border border-slate-200 bg-white shadow-sm">
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
          </div>
        )}

        {phase === 'intro' && <IntroPhase onStart={() => setPhase('orientation-time')} onBack={onBack} />}
        {phase === 'orientation-time' && <div className="max-w-3xl mx-auto"><OrientationTimePhase onBack={() => setPhase('intro')} onNext={(p, a) => handleNext('orientation-time', 'orientation-place', p, a)} /></div>}
        {phase === 'orientation-place' && <div className="max-w-3xl mx-auto"><OrientationPlacePhase onNext={(p, a) => handleNext('orientation-place', 'registration', p, a)} /></div>}
        {phase === 'registration' && <div className="max-w-3xl mx-auto"><RegistrationPhase onNext={(p, a) => handleNext('registration', 'attention', p, a)} /></div>}
        {phase === 'attention' && <div className="max-w-3xl mx-auto"><AttentionPhase onNext={(p, a) => handleNext('attention', 'recall', p, a)} /></div>}
        {phase === 'recall' && <div className="max-w-3xl mx-auto"><RecallPhase onNext={(p, a) => handleNext('recall', 'language-naming', p, a)} /></div>}
        {phase === 'language-naming' && <div className="max-w-3xl mx-auto"><NamingPhase onNext={(p, a) => handleNext('naming', 'language-repetition', p, a)} /></div>}
        {phase === 'language-repetition' && <div className="max-w-3xl mx-auto"><RepetitionPhase onNext={(p, a) => handleNext('repetition', 'language-drawing', p, a)} /></div>}
        {phase === 'language-drawing' && <div className="max-w-3xl mx-auto"><DrawingPhase onNext={(p, a) => handleNext('drawing', 'results', p, a)} /></div>}

        {phase === 'results' && (
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center border-t-8 border-indigo-600">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-14 h-14 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-gray-800">نتيجة تقييم MMSE</h1>
            <div className="mb-8">
              <span className="text-8xl font-black text-indigo-600">{totalScore}</span>
              <span className="text-3xl text-gray-400 font-bold">/30</span>
            </div>
            <div className="inline-block px-6 py-2 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xl mb-6">
              {getScoreInterpretation(totalScore).level}
            </div>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">{getScoreInterpretation(totalScore).description}</p>
            <button onClick={onBack} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transition-all">العودة للرئيسية</button>
          </div>
        )}
      </div>
    </div>
  );
}
