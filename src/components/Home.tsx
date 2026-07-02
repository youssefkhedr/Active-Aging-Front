import { Brain, Activity, BarChart3, Sparkles, Stethoscope, UserCog, Dumbbell, HeartPulse } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const menuItems = [
    {
      id: '/screening',
      title: 'الفحص التشخيصي',
      titleEn: 'Physical Screening',
      description: 'فحص بدني شامل وتلقائي',
      icon: Stethoscope,
      color: 'from-teal-500 to-cyan-600',
      shadow: 'shadow-teal-200',
      badge: 'خطوة 1',
    },
    {
      id: '/doctor',
      title: 'بوابة الطبيب',
      titleEn: 'Doctor Portal',
      description: 'إنشاء خطة علاجية مخصصة',
      icon: UserCog,
      color: 'from-indigo-500 to-purple-600',
      shadow: 'shadow-indigo-200',
      badge: 'خطوة 2',
    },
    {
      id: '/training-mode',
      title: 'وضع التدريب',
      titleEn: 'Training Mode',
      description: 'تدريب مع skeleton و strict matching',
      icon: Dumbbell,
      color: 'from-rose-500 to-pink-600',
      shadow: 'shadow-rose-200',
      badge: 'خطوة 3',
    },
    {
      id: '/cognitive',
      title: 'التقييم المعرفي',
      titleEn: 'Cognitive Assessment',
      description: 'فحص الذاكرة والقدرات الذهنية (MMSE & Mini-Cog)',
      icon: Brain,
      color: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-200',
    },
    {
      id: '/physical',
      title: 'تقييمات التوازن والحركة',
      titleEn: 'Balance & ROM Assessments',
      description: 'اختبارات التوازن والتقييم الوظيفي',
      icon: Activity,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-200',
    },
    {
      id: '/dashboard',
      title: 'النتائج والتقارير',
      titleEn: 'Results & Reports',
      description: 'متابعة التقدم والتقارير المحفوظة',
      icon: BarChart3,
      color: 'from-green-500 to-green-600',
      shadow: 'shadow-green-200',
    },
  ];

  const sarcopeniaItems = [
    {
      id: '/sarcopenia',
      title: 'تقييم الساركوبينيا',
      titleEn: 'Sarcopenia Assessment',
      description: 'اختبارات وظيفية SARC-F +',
      icon: HeartPulse,
      color: 'from-orange-500 to-orange-600',
      shadow: 'shadow-orange-200',
      badge: 'اختياري',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-12 h-12 text-purple-600 animate-pulse" />
            <h1 className="text-5xl">{t('appTitle')}</h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">
            {t('appSubtitle')}
          </p>
          <p className="text-lg text-gray-500">
            تحسين القدرات البدنية والمعرفية باستخدام الذكاء الاصطناعي
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`
                  relative overflow-hidden rounded-2xl p-6 
                  bg-gradient-to-br ${item.color} 
                  text-white shadow-xl ${item.shadow}
                  transform transition-all duration-300 
                  hover:scale-105 hover:shadow-2xl
                  text-right group
                `}
              >
                {item.badge && (
                  <div className="absolute top-3 left-3 bg-white text-gray-800 text-xs px-3 py-1 rounded-full font-medium">
                    {item.badge}
                  </div>
                )}

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-10 h-10 opacity-90 group-hover:scale-110 transition-transform" />
                  </div>
                  <h2 className="text-xl mb-2">{item.title}</h2>
                  <p className="text-sm opacity-90 mb-1">{item.titleEn}</p>
                  <p className="text-sm opacity-80">{item.description}</p>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12" />
              </button>
            );
          })}
        </div>

        {/* Sarcopenia Module - Optional Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <HeartPulse className="w-8 h-8 text-orange-600" />
            <h2 className="text-2xl font-bold">وحدة الساركوبينيا (اختيارية)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sarcopeniaItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`
                    relative overflow-hidden rounded-2xl p-6 
                    bg-gradient-to-br ${item.color} 
                    text-white shadow-xl ${item.shadow}
                    transform transition-all duration-300 
                    hover:scale-105 hover:shadow-2xl
                    text-right group
                  `}
                >
                  {item.badge && (
                    <div className="absolute top-3 left-3 bg-white text-gray-800 text-xs px-3 py-1 rounded-full font-medium">
                      {item.badge}
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <Icon className="w-10 h-10 opacity-90 group-hover:scale-110 transition-transform" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">{item.title}</h2>
                    <p className="text-sm opacity-90 mb-1">{item.titleEn}</p>
                    <p className="text-sm opacity-80">{item.description}</p>
                  </div>

                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12" />
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}