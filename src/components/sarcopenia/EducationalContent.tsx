import { ArrowLeft, BookOpen, Apple, Sun, Activity, Info } from 'lucide-react';

interface EducationalContentProps {
  onBack: () => void;
}

export function EducationalContent({ onBack }: EducationalContentProps) {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow mb-6"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <BookOpen className="w-12 h-12 text-orange-500" />
            <div>
              <h1 className="text-3xl">الوعي بالساركوبينيا</h1>
              <p className="text-gray-600">Sarcopenia Awareness</p>
            </div>
          </div>

          <div className="bg-orange-50 border-r-4 border-orange-500 p-6 rounded-xl mb-8">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg mb-2">ملاحظة هامة</h3>
                <p className="text-gray-700 text-sm">
                  المعلومات التالية للتوعية فقط ولا تُعتبر نصائح طبية.
                  استشر طبيبك أو أخصائي تغذية قبل إجراء أي تغييرات على نظامك الغذائي أو الرياضي.
                </p>
              </div>
            </div>
          </div>

          {/* Protein Importance */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <Apple className="w-6 h-6 text-blue-700" />
              </div>
              <h2 className="text-2xl text-blue-900">أهمية البروتين</h2>
            </div>

            <div className="space-y-4 text-gray-800">
              <div className="bg-white bg-opacity-60 p-4 rounded-lg">
                <h3 className="font-medium mb-2">لماذا البروتين مهم؟</h3>
                <p className="text-sm">
                  البروتين هو اللبنة الأساسية للعضلات. مع التقدم في العمر، يحتاج الجسم
                  لكمية أكبر من البروتين للحفاظ على الكتلة العضلية.
                </p>
              </div>

              <div className="bg-white bg-opacity-60 p-4 rounded-lg">
                <h3 className="font-medium mb-2">الكمية الموصى بها</h3>
                <p className="text-sm mb-2">
                  كبار السن قد يحتاجون 1.0-1.2 جرام بروتين لكل كيلوغرام من وزن الجسم يومياً
                  (استشر طبيبك للمعرفة الدقيقة).
                </p>
              </div>

              <div className="bg-white bg-opacity-60 p-4 rounded-lg">
                <h3 className="font-medium mb-3">مصادر البروتين الجيدة:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <span>اللحوم الحمراء قليلة الدهن</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <span>الدجاج والسمك</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <span>البيض</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <span>البقوليات (عدس، فول، حمص)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <span>منتجات الألبان</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <span>المكسرات والبذور</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-r-4 border-yellow-400 p-3 rounded">
                <p className="text-sm text-yellow-800">
                  💡 نصيحة: وزّع تناول البروتين على مدار اليوم بدلاً من تناوله دفعة واحدة
                </p>
              </div>
            </div>
          </div>

          {/* Vitamin D Importance */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                <Sun className="w-6 h-6 text-yellow-700" />
              </div>
              <h2 className="text-2xl text-yellow-900">فيتامين د (Vitamin D)</h2>
            </div>

            <div className="space-y-4 text-gray-800">
              <div className="bg-white bg-opacity-60 p-4 rounded-lg">
                <h3 className="font-medium mb-2">دوره في صحة العضلات</h3>
                <p className="text-sm">
                  فيتامين د ضروري لامتصاص الكالسيوم وقوة العضلات. نقصه يرتبط بضعف العضلات
                  وزيادة خطر السقوط.
                </p>
              </div>

              <div className="bg-white bg-opacity-60 p-4 rounded-lg">
                <h3 className="font-medium mb-3">مصادر فيتامين د:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">التعرض لأشعة الشمس</p>
                      <p className="text-gray-600">10-15 دقيقة يومياً (مع الحذر من الحروق)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">الأطعمة الغنية بفيتامين د</p>
                      <p className="text-gray-600">الأسماك الدهنية، صفار البيض، الحليب المدعم</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">المكملات الغذائية</p>
                      <p className="text-gray-600">استشر طبيبك للجرعة المناسبة</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border-r-4 border-orange-400 p-3 rounded">
                <p className="text-sm text-orange-800">
                  ⚠️ استشر طبيبك لفحص مستوى فيتامين د في الدم قبل تناول أي مكملات
                </p>
              </div>
            </div>
          </div>

          {/* Physical Activity */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-700" />
              </div>
              <h2 className="text-2xl text-green-900">النشاط البدني</h2>
            </div>

            <div className="space-y-4 text-gray-800">
              <div className="bg-white bg-opacity-60 p-4 rounded-lg">
                <h3 className="font-medium mb-2">تمارين المقاومة (Resistance Training)</h3>
                <p className="text-sm mb-3">
                  تمارين القوة هي الأكثر فعالية لبناء والحفاظ على الكتلة العضلية.
                </p>
                <div className="space-y-2 text-sm">
                  <p>• استخدام الأوزان الخفيفة أو المقاومة بوزن الجسم</p>
                  <p>• 2-3 مرات أسبوعياً</p>
                  <p>• استهدف جميع المجموعات العضلية الرئيسية</p>
                </div>
              </div>

              <div className="bg-white bg-opacity-60 p-4 rounded-lg">
                <h3 className="font-medium mb-2">تمارين الإطالة والمرونة</h3>
                <p className="text-sm mb-2">
                  تحسن من نطاق الحركة وتقلل من خطر الإصابات.
                </p>
                <p className="text-sm">• يُنصح بها يومياً، خاصةً بعد التمارين</p>
              </div>

              <div className="bg-white bg-opacity-60 p-4 rounded-lg">
                <h3 className="font-medium mb-2">تمارين التوازن</h3>
                <p className="text-sm mb-2">
                  تقلل من خطر السقوط وتحسن الثقة في الحركة.
                </p>
                <p className="text-sm">• الوقوف على قدم واحدة، المشي على خط مستقيم، Tai Chi</p>
              </div>

              <div className="bg-green-50 border-r-4 border-green-400 p-3 rounded">
                <p className="text-sm text-green-800">
                  💪 ابدأ تدريجياً وزد الشدة ببطء. استشر طبيبك قبل بدء أي برنامج تدريبي جديد.
                </p>
              </div>
            </div>
          </div>

          {/* General Tips */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-xl mb-4">نصائح عامة للوقاية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-medium mb-2 text-blue-700">التغذية</h3>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• تناول وجبات متوازنة</li>
                  <li>• اشرب كمية كافية من الماء</li>
                  <li>• قلل من الأطعمة المصنعة</li>
                  <li>• تناول الفواكه والخضروات</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-medium mb-2 text-green-700">نمط الحياة</h3>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• ابقَ نشطاً بدنياً</li>
                  <li>• احصل على نوم كافٍ (7-9 ساعات)</li>
                  <li>• قلل التوتر</li>
                  <li>• راجع طبيبك بانتظام</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border-r-4 border-orange-500 p-6 rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium mb-2">تذكير نهائي</h3>
              <p className="text-sm text-gray-700">
                هذا المحتوى للتوعية الصحية فقط. لا يُعتبر بديلاً عن الاستشارة الطبية المهنية.
                لا تبدأ أي برنامج غذائي أو تدريبي جديد أو تتناول مكملات دون استشارة طبيبك أولاً.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
