import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, Brain, Zap, Target } from 'lucide-react';

interface CognitiveGamesProps {
  onBack: () => void;
}

export function CognitiveGames({ onBack }: CognitiveGamesProps) {
  const navigate = useNavigate();

  const games = [
    {
      id: '/cognitive/stroop',
      title: 'اختبار ستروب',
      titleEn: 'Stroop Test',
      description: 'قياس التحكم المثبط وسرعة المعالجة',
      icon: Brain,
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: '/cognitive/reaction',
      title: 'اختبار سرعة الاستجابة',
      titleEn: 'Reaction Time Test',
      description: 'قياس الاستجابة الحركية-العصبية',
      icon: Zap,
      color: 'from-yellow-500 to-orange-600',
    },
    {
      id: '/cognitive/memory',
      title: 'اختبار الذاكرة',
      titleEn: 'Memory Test',
      description: 'تحسين الذاكرة العاملة والانتباه',
      icon: Target,
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: '/cognitive/mini-cog',
      title: 'اختبار Mini-Cog',
      titleEn: 'Mini-Cog Test',
      description: 'فحص معرفي سريع (3-5 دقائق)',
      icon: Clock,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      id: '/cognitive/mmse',
      title: 'اختبار MMSE',
      titleEn: 'Mini-Mental State Exam',
      description: 'تقييم معرفي شامل (10 دقائق)',
      icon: FileText,
      color: 'from-indigo-500 to-indigo-600',
    },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">التقييمات المعرفية</h1>
            <p className="text-gray-600 italic">Clinical Cognitive Assessment</p>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {games.map((game) => {
            const Icon = game.icon;
            return (
              <button
                key={game.id}
                onClick={() => navigate(game.id)}
                className={`
                  relative overflow-hidden rounded-2xl p-8 
                  bg-gradient-to-br ${game.color} 
                  text-white shadow-xl
                  transform transition-all duration-300 
                  hover:scale-105 hover:shadow-2xl
                  text-right group
                `}
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className="w-12 h-12 opacity-90 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{game.title}</h3>
                <p className="opacity-90 mb-1">{game.titleEn}</p>
                <p className="text-sm opacity-80">{game.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}