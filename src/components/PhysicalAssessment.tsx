import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Gauge, ClipboardList } from 'lucide-react';

interface PhysicalAssessmentProps {
  onBack: () => void;
}

// Assessment components hub component

export function PhysicalAssessment({ onBack }: PhysicalAssessmentProps) {
  const navigate = useNavigate();

  const assessments = [
    {
      id: '/physical/balance',
      title: 'تقييم التوازن',
      titleEn: 'Balance Assessment',
      description: 'قياس الاستقرار والتوازن باستخدام الحساسات',
      icon: Gauge,
      color: 'from-green-500 to-green-600',
      category: 'assessment',
    },
    {
      id: '/physical/functional',
      title: 'التقييم الوظيفي',
      titleEn: 'Functional Assessment',
      description: 'استبيانات وتقييم أجزاء الجسم',
      icon: ClipboardList,
      color: 'from-blue-500 to-blue-600',
      category: 'assessment',
    },

  ];

  // State rendering removed - handled by Router

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
            <h1 className="text-3xl">الألعاب التفاعلية</h1>
            <p className="text-gray-600">Physical Assessment & Therapeutic Games</p>
          </div>
        </div>

        {/* Assessments Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <ClipboardList className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">التقييمات السريرية</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assessments.filter(a => a.category === 'assessment').map((assessment) => {
              const Icon = assessment.icon;
              return (
                <button
                  key={assessment.id}
                  onClick={() => navigate(assessment.id)}
                  className={`
                    relative overflow-hidden rounded-2xl p-8 
                    bg-gradient-to-br ${assessment.color} 
                    text-white shadow-xl
                    transform transition-all duration-300 
                    hover:scale-105 hover:shadow-2xl
                    text-right group
                  `}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="w-12 h-12 opacity-90 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{assessment.title}</h3>
                  <p className="opacity-90 mb-1">{assessment.titleEn}</p>
                  <p className="text-sm opacity-80">{assessment.description}</p>

                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12" />
                </button>
              );
            })}
          </div>
        </div>



        {/* Information Panel */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">التقييم البدني الذكي</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">تقنية Computer Vision</h3>
                <p className="text-gray-600 leading-relaxed">
                  نستخدم MediaPipe Pose لتتبع حركة المفاصل بدقة عالية من خلال كاميرا الهاتف فقط.
                  يمكننا قياس زوايا المفاصل بدقة تصل إلى ±5 درجات.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Gauge className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">مستشعرات الحركة</h3>
                <p className="text-gray-600 leading-relaxed">
                  نستخدم Accelerometer و Gyroscope المدمجة في هاتفك لقياس التوازن والاستقرار.
                  يتم حساب مقاييس مثل COP Velocity و Sway Area.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded-xl">
              <h3 className="font-bold text-blue-900 mb-1">توصيات مخصصة</h3>
              <p className="text-blue-800 text-sm">
                بناءً على نتائجك، سيقوم النظام بإعطائك تمارين وتوصيات مخصصة لتحسين التوازن والقدرة الحركية.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}