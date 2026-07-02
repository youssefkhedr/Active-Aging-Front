import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Target, Calendar, CheckCircle, Clock, Brain, Activity } from 'lucide-react';
import { getGameResults, getPhysicalResults, getActiveDoctorPlan, getTrainingSessions } from '../utils/storage';
import { trainingService } from '../services/training.service';

interface TrainingPlanProps {
  onBack: () => void;
}

interface Exercise {
  id: string;
  title: string;
  type: 'cognitive' | 'physical';
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  icon: any;
  color: string;
}

interface WeekPlan {
  day: string;
  exercises: Exercise[];
  completed: boolean;
}

export function TrainingPlan({ onBack }: TrainingPlanProps) {
  const [weeklyPlan, setWeeklyPlan] = useState<WeekPlan[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [userLevel, setUserLevel] = useState<{ cognitive: string; physical: string }>({
    cognitive: 'مبتدئ',
    physical: 'مبتدئ',
  });

  useEffect(() => {
    generatePersonalizedPlan();
  }, []);

  const generatePersonalizedPlan = async () => {
    // 1. Try to fetch plan from backend
    try {
      const activePlan = await trainingService.getCurrentPlan();
      if (activePlan) {
        setAiRecommendations([
          `لديك خطة تدريبية من الطبيب: ${activePlan.title}`,
          activePlan.description || 'استخدم وضع التدريب (Training Mode) لتنفيذ الخطة',
          'الذكاء الاصطناعي سيساعد فقط في ضبط الصعوبة داخل التمارين',
        ]);

        // In a real app, we would map backend exercises to our exercisePool
        // and set the weeklyPlan accordingly. For now, we show the doctor's name/title.
        return;
      }
    } catch (error) {
      console.error('Failed to fetch training plans from backend:', error);
    }

    // 2. Fallback to local generation if no backend plan
    const allCognitiveResults = getGameResults();
    const allPhysicalResults = getPhysicalResults();
    const doctorPlan = getActiveDoctorPlan();

    // If local doctor plan exists, show it instead
    if (doctorPlan) {
      // Show doctor's plan with a note
      setAiRecommendations([
        'لديك خطة تدريبية من الطبيب ' + doctorPlan.doctorName,
        'استخدم وضع التدريب (Training Mode) لتنفيذ الخطة',
        'الذكاء الاصطناعي سيساعد فقط في ضبط الصعوبة داخل التمارين',
      ]);
      return;
    }

    // Assess user levels based on performance
    const cognitiveLevel = assessCognitiveLevel(allCognitiveResults);
    const physicalLevel = assessPhysicalLevel(allPhysicalResults);

    setUserLevel({ cognitive: cognitiveLevel, physical: physicalLevel });

    // Generate AI recommendations
    const recommendations = generateAIRecommendations(
      cognitiveLevel,
      physicalLevel,
      allCognitiveResults,
      allPhysicalResults
    );
    setAiRecommendations(recommendations);

    // Generate weekly plan based on user level
    const plan = generateWeeklyPlan(cognitiveLevel, physicalLevel);
    setWeeklyPlan(plan);
  };

  const assessCognitiveLevel = (results: any[]): string => {
    if (results.length === 0) return 'مبتدئ';

    const recentResults = results.slice(-5);
    const avgAccuracy = recentResults.reduce((sum, r) => sum + r.accuracy, 0) / recentResults.length;
    const avgReactionTime = recentResults.reduce((sum, r) => sum + r.avgReactionTime, 0) / recentResults.length;

    if (avgAccuracy >= 85 && avgReactionTime < 500) return 'متقدم';
    if (avgAccuracy >= 70 && avgReactionTime < 700) return 'متوسط';
    return 'مبتدئ';
  };

  const assessPhysicalLevel = (results: any[]): string => {
    if (results.length === 0) return 'مبتدئ';

    const balanceResults = results.filter(r => r.assessmentType === 'balance');
    if (balanceResults.length === 0) return 'مبتدئ';

    const avgBalance = balanceResults.reduce((sum, r) => sum + r.value, 0) / balanceResults.length;

    if (avgBalance >= 80) return 'متقدم';
    if (avgBalance >= 60) return 'متوسط';
    return 'مبتدئ';
  };

  const generateAIRecommendations = (
    cogLevel: string,
    physLevel: string,
    cogResults: any[],
    physResults: any[]
  ): string[] => {
    const recommendations: string[] = [];

    // Cognitive recommendations
    if (cogLevel === 'مبتدئ') {
      recommendations.push('ابدأ بألعاب بسيطة لمدة 5-10 دقائق يومياً');
      recommendations.push('ركز على لعبة واحدة حتى تتقنها قبل الانتقال للأخرى');
    } else if (cogLevel === 'متوسط') {
      recommendations.push('حاول زيادة صعوبة الألعاب تدريجياً');
      recommendations.push('نوّع بين الألعاب المختلفة لتحسين مهارات متعددة');
    } else {
      recommendations.push('تحدى نفسك بمستويات أصعب وأهداف زمنية أقل');
      recommendations.push('حافظ على ممارسة منتظمة للحفاظ على مستواك');
    }

    // Physical recommendations
    if (physLevel === 'مبتدئ') {
      recommendations.push('ابدأ بتمارين توازن بسيطة مع استخدام الدعامات');
      recommendations.push('مارس تمارين المدى الحركي يومياً لمدة 5 دقائق');
    } else if (physLevel === 'متوسط') {
      recommendations.push('زد مدة تمارين التوازن إلى 30-45 ثانية');
      recommendations.push('جرب تمارين أكثر تحدياً مثل الوقوف على قدم واحدة');
    } else {
      recommendations.push('حافظ على برنامجك التدريبي الحالي');
      recommendations.push('يمكنك إضافة تمارين Tai Chi أو Yoga للتنوع');
    }

    // General recommendations
    if (cogResults.length < 5) {
      recommendations.push('ننصحك بممارسة الألعاب المعرفية بانتظام لمدة أسبوعين لتقييم أفضل');
    }

    if (physResults.length < 3) {
      recommendations.push('أكمل التقييمات البدنية للحصول على برنامج مخصص أكثر دقة');
    }

    return recommendations;
  };

  const generateWeeklyPlan = (cogLevel: string, physLevel: string): WeekPlan[] => {
    const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

    const exercisePool: Exercise[] = [
      {
        id: 'stroop-basic',
        title: 'اختبار ستروب',
        type: 'cognitive',
        duration: 3,
        difficulty: 'easy',
        description: 'تحسين التحكم المثبط والانتباه',
        icon: Brain,
        color: 'purple',
      },
      {
        id: 'reaction-basic',
        title: 'تدريب سرعة الاستجابة',
        type: 'cognitive',
        duration: 5,
        difficulty: 'easy',
        description: 'تحسين سرعة رد الفعل',
        icon: Target,
        color: 'yellow',
      },
      {
        id: 'memory-basic',
        title: 'تمرين الذاكرة',
        type: 'cognitive',
        duration: 5,
        difficulty: 'medium',
        description: 'تقوية الذاكرة العاملة',
        icon: Brain,
        color: 'blue',
      },
      {
        id: 'balance-basic',
        title: 'تمرين التوازن الأساسي',
        type: 'physical',
        duration: 10,
        difficulty: 'easy',
        description: 'الوقوف على قدمين مع إغلاق العينين',
        icon: Activity,
        color: 'green',
      },
      {
        id: 'rom-shoulder',
        title: 'تمرين مدى حركة الكتف',
        type: 'physical',
        duration: 8,
        difficulty: 'easy',
        description: 'رفع الذراعين للأمام والجانب',
        icon: Activity,
        color: 'blue',
      },
      {
        id: 'balance-advanced',
        title: 'تمرين التوازن المتقدم',
        type: 'physical',
        duration: 15,
        difficulty: 'hard',
        description: 'الوقوف على قدم واحدة',
        icon: Activity,
        color: 'orange',
      },
    ];

    const plan: WeekPlan[] = days.map((day, index) => {
      const exercises: Exercise[] = [];

      // Alternate between cognitive and physical exercises
      if (index % 2 === 0) {
        // Cognitive-focused day
        exercises.push(exercisePool[0]); // Stroop
        exercises.push(exercisePool[1]); // Reaction
        if (cogLevel !== 'مبتدئ') {
          exercises.push(exercisePool[2]); // Memory
        }
      } else {
        // Physical-focused day
        exercises.push(exercisePool[3]); // Balance basic
        exercises.push(exercisePool[4]); // ROM
        if (physLevel === 'متقدم') {
          exercises.push(exercisePool[5]); // Balance advanced
        }
      }

      // Rest day on Friday
      if (index === 6) {
        return {
          day,
          exercises: [],
          completed: false,
        };
      }

      return {
        day,
        exercises,
        completed: false,
      };
    });

    return plan;
  };

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
            <h1 className="text-3xl">خطة التدريب الشخصية</h1>
            <p className="text-gray-600">Personalized Training Plan</p>
          </div>
        </div>

        {/* User Level Assessment */}
        <div className="bg-gradient-to-br from-purple-500 to-blue-600 text-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-10 h-10" />
            <h2 className="text-2xl">تقييم مستواك الحالي</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-6 h-6" />
                <h3 className="text-lg">المستوى المعرفي</h3>
              </div>
              <p className="text-3xl">{userLevel.cognitive}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-6 h-6" />
                <h3 className="text-lg">المستوى البدني</h3>
              </div>
              <p className="text-3xl">{userLevel.physical}</p>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl">توصيات الذكاء الاصطناعي</h2>
          </div>
          <div className="space-y-4">
            {aiRecommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 bg-purple-50 p-4 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-purple-700">{index + 1}</span>
                </div>
                <p className="text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Plan */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl">برنامج الأسبوع</h2>
          </div>

          <div className="space-y-4">
            {weeklyPlan.map((dayPlan, index) => (
              <div key={index} className="border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl">{dayPlan.day}</h3>
                  {dayPlan.exercises.length === 0 ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      يوم راحة
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {dayPlan.exercises.reduce((sum, ex) => sum + ex.duration, 0)} دقيقة
                      </span>
                    </div>
                  )}
                </div>

                {dayPlan.exercises.length > 0 && (
                  <div className="space-y-3">
                    {dayPlan.exercises.map((exercise, exIndex) => {
                      const Icon = exercise.icon;
                      return (
                        <div
                          key={exIndex}
                          className={`
                            flex items-center gap-4 p-4 rounded-lg
                            ${exercise.type === 'cognitive'
                              ? 'bg-purple-50 border-r-4 border-purple-500'
                              : 'bg-blue-50 border-r-4 border-blue-500'
                            }
                          `}
                        >
                          <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                            ${exercise.type === 'cognitive' ? 'bg-purple-200' : 'bg-blue-200'}
                          `}>
                            <Icon className={`w-6 h-6 ${exercise.type === 'cognitive' ? 'text-purple-700' : 'text-blue-700'
                              }`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="mb-1">{exercise.title}</h4>
                            <p className="text-sm text-gray-600">{exercise.description}</p>
                          </div>
                          <div className="text-left">
                            <p className="text-sm text-gray-600">المدة</p>
                            <p className="text-lg">{exercise.duration} د</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
          <h3 className="text-lg mb-3">💡 نصائح للنجاح</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• اتبع البرنامج بانتظام للحصول على أفضل النتائج</li>
            <li>• خذ فترات راحة بين التمارين</li>
            <li>• اشرب الماء بانتظام</li>
            <li>• لا تتردد في تعديل البرنامج حسب راحتك</li>
            <li>• استشر طبيبك قبل البدء بأي برنامج تدريبي</li>
          </ul>
        </div>
      </div>
    </div>
  );
}