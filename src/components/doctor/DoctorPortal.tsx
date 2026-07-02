import { useState } from 'react';
import { ArrowLeft, Save, Calendar, User, Activity } from 'lucide-react';
import { saveDoctorPlan, getLatestScreeningReport, type Exercise, type DoctorPlan } from '../../utils/storage';

interface DoctorPortalProps {
  onBack: () => void;
  onPlanCreated: () => void;
}

const EXERCISE_LIBRARY: Exercise[] = [
  {
    id: 'shoulder-flexion',
    name: 'رفع الذراع للأمام',
    nameEn: 'Shoulder Flexion',
    joint: 'shoulder',
    sets: 3,
    reps: 10,
    speed: 'slow',
    targetAngle: 160,
    angleRange: { min: 155, max: 165 },
    instructions: 'ارفع ذراعك ببطء للأمام حتى تصل للزاوية المطلوبة',
    category: 'rom',
  },
  {
    id: 'shoulder-abduction',
    name: 'رفع الذراع للجانب',
    nameEn: 'Shoulder Abduction',
    joint: 'shoulder',
    sets: 3,
    reps: 10,
    speed: 'slow',
    targetAngle: 150,
    angleRange: { min: 145, max: 155 },
    instructions: 'ارفع ذراعك للجانب ببطء',
    category: 'rom',
  },
  {
    id: 'knee-extension',
    name: 'فرد الركبة',
    nameEn: 'Knee Extension',
    joint: 'knee',
    sets: 3,
    reps: 12,
    speed: 'medium',
    targetAngle: 170,
    angleRange: { min: 165, max: 175 },
    instructions: 'افرد ركبتك بالكامل من وضع الجلوس',
    category: 'rom',
  },
  {
    id: 'knee-flexion',
    name: 'ثني الركبة',
    nameEn: 'Knee Flexion',
    joint: 'knee',
    sets: 3,
    reps: 12,
    speed: 'medium',
    targetAngle: 130,
    angleRange: { min: 125, max: 135 },
    instructions: 'اثنِ ركبتك ببطء حتى الزاوية المطلوبة',
    category: 'rom',
  },
  {
    id: 'hip-flexion',
    name: 'رفع الفخذ',
    nameEn: 'Hip Flexion',
    joint: 'hip',
    sets: 3,
    reps: 10,
    speed: 'slow',
    targetAngle: 90,
    angleRange: { min: 85, max: 95 },
    instructions: 'ارفع فخذك للأمام حتى 90 درجة',
    category: 'rom',
  },
  {
    id: 'hip-rotation',
    name: 'دوران الورك الخارجي',
    nameEn: 'Hip External Rotation',
    joint: 'hip',
    sets: 3,
    reps: 10,
    speed: 'slow',
    targetAngle: 45,
    angleRange: { min: 40, max: 50 },
    instructions: 'حرّك فخذك للخارج ببطء',
    category: 'rom',
  },
  {
    id: 'ankle-dorsiflexion',
    name: 'ثني الكاحل للأعلى',
    nameEn: 'Ankle Dorsiflexion',
    joint: 'ankle',
    sets: 3,
    reps: 15,
    speed: 'medium',
    targetAngle: 20,
    angleRange: { min: 15, max: 25 },
    instructions: 'اثنِ قدمك للأعلى بأقصى ما تستطيع',
    category: 'rom',
  },
  {
    id: 'spine-flexion',
    name: 'ثني الجذع للأمام',
    nameEn: 'Spine Flexion',
    joint: 'spine',
    sets: 2,
    reps: 8,
    speed: 'slow',
    targetAngle: 80,
    angleRange: { min: 75, max: 85 },
    instructions: 'اثنِ جذعك للأمام ببطء مع الحفاظ على استقامة الظهر',
    category: 'rom',
  },
  // Sarcopenia-specific exercises
  {
    id: 'chair-stand-training',
    name: 'تدريب القيام من الكرسي',
    nameEn: 'Chair Stand Training',
    joint: 'legs',
    sets: 3,
    reps: 10,
    speed: 'slow',
    targetAngle: 90,
    angleRange: { min: 85, max: 95 },
    instructions: 'قم واجلس من الكرسي بدون استخدام اليدين',
    category: 'sarcopenia',
  },
  {
    id: 'wall-pushup-training',
    name: 'الضغط على الحائط',
    nameEn: 'Wall Push-Up',
    joint: 'arms',
    sets: 3,
    reps: 12,
    speed: 'medium',
    targetAngle: 45,
    angleRange: { min: 40, max: 50 },
    instructions: 'قم بالضغط على الحائط مع الحفاظ على استقامة الجسم',
    category: 'sarcopenia',
  },
  {
    id: 'wall-sit-training',
    name: 'الجلوس على الحائط (Isometric)',
    nameEn: 'Wall Sit Hold',
    joint: 'legs',
    sets: 3,
    reps: 1,
    speed: 'slow',
    targetAngle: 90,
    angleRange: { min: 85, max: 95 },
    instructions: 'اجلس على الحائط بزاوية 90 درجة واثبت لمدة 30 ثانية',
    category: 'sarcopenia',
  },
  {
    id: 'calf-raise',
    name: 'رفع العقب (Calf Raise)',
    nameEn: 'Calf Raise',
    joint: 'ankle',
    sets: 3,
    reps: 15,
    speed: 'medium',
    targetAngle: 30,
    angleRange: { min: 25, max: 35 },
    instructions: 'قف على أطراف أصابع قدميك ثم انزل ببطء',
    category: 'sarcopenia',
  },
];

const DAYS_OF_WEEK = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function DoctorPortal({ onBack, onPlanCreated }: DoctorPortalProps) {
  const [step, setStep] = useState<'patient-info' | 'select-joints' | 'select-exercises' | 'schedule' | 'review'>('patient-info');
  const [doctorName, setDoctorName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [injuredJoints, setInjuredJoints] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<DoctorPlan['weeklySchedule']>([]);
  const [notes, setNotes] = useState('');

  const screeningReport = getLatestScreeningReport();

  const handleJointToggle = (joint: string) => {
    setInjuredJoints(prev =>
      prev.includes(joint)
        ? prev.filter(j => j !== joint)
        : [...prev, joint]
    );
  };

  const handleExerciseToggle = (exercise: Exercise) => {
    setSelectedExercises(prev => {
      const exists = prev.find(e => e.id === exercise.id);
      if (exists) {
        return prev.filter(e => e.id !== exercise.id);
      } else {
        return [...prev, exercise];
      }
    });
  };

  const handleExerciseUpdate = (exerciseId: string, field: keyof Exercise, value: any) => {
    setSelectedExercises(prev =>
      prev.map(ex =>
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      )
    );
  };

  const generateDefaultSchedule = () => {
    const schedule: DoctorPlan['weeklySchedule'] = [];
    const exerciseIds = selectedExercises.map(e => e.id);

    // Distribute exercises across 5 days (2 days rest)
    const activeDays = 5;
    const exercisesPerDay = Math.ceil(exerciseIds.length / activeDays);

    DAYS_OF_WEEK.slice(0, activeDays).forEach((day, idx) => {
      const startIdx = idx * exercisesPerDay;
      const dayExercises = exerciseIds.slice(startIdx, startIdx + exercisesPerDay);

      schedule.push({
        day,
        exercises: dayExercises,
        sessionGoal: `التركيز على ${selectedExercises.find(e => dayExercises.includes(e.id))?.joint}`,
      });
    });

    // Add rest days
    schedule.push({
      day: 'الجمعة',
      exercises: [],
      sessionGoal: 'يوم راحة',
    });
    schedule.push({
      day: 'السبت',
      exercises: [],
      sessionGoal: 'يوم راحة',
    });

    setWeeklySchedule(schedule);
  };

  const handleCreatePlan = () => {
    const plan: DoctorPlan = {
      id: `plan-${Date.now()}`,
      patientId,
      doctorName,
      createdAt: Date.now(),
      startDate: Date.now(),
      durationWeeks,
      injuredJoints,
      exercises: selectedExercises,
      weeklySchedule,
      notes,
      status: 'active',
    };

    saveDoctorPlan(plan);
    onPlanCreated();
  };

  if (step === 'patient-info') {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={onBack}
            className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow mb-6"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <User className="w-12 h-12 text-blue-500" />
              <div>
                <h1 className="text-3xl">بوابة المريض</h1>
                <p className="text-gray-600">Patient Portal - إدخال بيانات الخطة</p>
              </div>
            </div>

            {/* Show screening report summary */}
            {screeningReport && (
              <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded mb-6">
                <h3 className="mb-3">📋 نتائج الفحص الأولي</h3>
                <div className="grid grid-cols-2 gap-3">
                  {screeningReport.results.map(result => (
                    <div key={result.joint} className="text-sm">
                      <span className="font-medium">{result.joint}:</span>{' '}
                      <span className={
                        result.status === 'normal' ? 'text-green-600' :
                          result.status === 'limited' ? 'text-yellow-600' :
                            result.status === 'weak' ? 'text-orange-600' :
                              'text-red-600'
                      }>
                        {result.status}
                      </span>
                      {' '}({result.angle}°)
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm mb-2">اسم الطبيب *</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="د. أحمد محمد"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">رقم ملف المريض *</label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="مثال: P-2024-001"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">مدة البرنامج (بالأسابيع) *</label>
                <input
                  type="number"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(parseInt(e.target.value))}
                  min="1"
                  max="12"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => setStep('select-joints')}
              disabled={!doctorName || !patientId}
              className="w-full mt-8 py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              التالي: اختيار المفاصل
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'select-joints') {
    const availableJoints = ['shoulder', 'knee', 'hip', 'ankle', 'spine'];

    return (
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setStep('patient-info')}
            className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow mb-6"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl mb-6">اختر المفاصل المصابة أو التي تحتاج لتدريب</h2>

            <div className="space-y-4 mb-8">
              {availableJoints.map(joint => {
                const screeningResult = screeningReport?.results.find(r => r.joint === joint);

                return (
                  <button
                    key={joint}
                    onClick={() => handleJointToggle(joint)}
                    className={`
                      w-full p-4 rounded-xl border-2 text-right transition-all
                      ${injuredJoints.includes(joint)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-6 h-6 rounded-full border-2
                          ${injuredJoints.includes(joint)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                          }
                          flex items-center justify-center
                        `}>
                          {injuredJoints.includes(joint) && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-lg capitalize">{joint}</span>
                      </div>

                      {screeningResult && (
                        <div className="text-sm">
                          <span className={`
                            px-3 py-1 rounded-full
                            ${screeningResult.status === 'normal' ? 'bg-green-100 text-green-700' : ''}
                            ${screeningResult.status === 'limited' ? 'bg-yellow-100 text-yellow-700' : ''}
                            ${screeningResult.status === 'weak' ? 'bg-orange-100 text-orange-700' : ''}
                            ${screeningResult.status === 'needs_correction' ? 'bg-red-100 text-red-700' : ''}
                          `}>
                            {screeningResult.status} ({screeningResult.angle}°)
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep('select-exercises')}
              disabled={injuredJoints.length === 0}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              التالي: اختيار التمارين ({injuredJoints.length} مفاصل)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'select-exercises') {
    const relevantExercises = EXERCISE_LIBRARY.filter(ex =>
      injuredJoints.includes(ex.joint)
    );

    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setStep('select-joints')}
            className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow mb-6"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl mb-6">اختر التمارين المناسبة</h2>

            <div className="space-y-4 mb-8">
              {relevantExercises.map(exercise => {
                const isSelected = selectedExercises.find(e => e.id === exercise.id);

                return (
                  <div
                    key={exercise.id}
                    className={`
                      p-4 rounded-xl border-2 transition-all
                      ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleExerciseToggle(exercise)}
                        className={`
                          mt-1 w-6 h-6 rounded border-2 flex-shrink-0
                          ${isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                          }
                          flex items-center justify-center
                        `}
                      >
                        {isSelected && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      <div className="flex-1">
                        <h3 className="text-lg mb-1">{exercise.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{exercise.nameEn}</p>
                        <p className="text-sm text-gray-700 mb-3">{exercise.instructions}</p>

                        {isSelected && (
                          <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">المجموعات</label>
                              <input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => handleExerciseUpdate(exercise.id, 'sets', parseInt(e.target.value))}
                                min="1"
                                max="5"
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">التكرارات</label>
                              <input
                                type="number"
                                value={exercise.reps}
                                onChange={(e) => handleExerciseUpdate(exercise.id, 'reps', parseInt(e.target.value))}
                                min="1"
                                max="20"
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">السرعة</label>
                              <select
                                value={exercise.speed}
                                onChange={(e) => handleExerciseUpdate(exercise.id, 'speed', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                              >
                                <option value="slow">بطيء</option>
                                <option value="medium">متوسط</option>
                                <option value="fast">سريع</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                generateDefaultSchedule();
                setStep('schedule');
              }}
              disabled={selectedExercises.length === 0}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              التالي: إعداد الجدول الأسبوعي ({selectedExercises.length} تمارين)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'schedule') {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setStep('select-exercises')}
            className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow mb-6"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-8 h-8 text-blue-500" />
              <h2 className="text-2xl">الجدول الأسبوعي</h2>
            </div>

            <div className="space-y-4 mb-8">
              {weeklySchedule.map((day, idx) => (
                <div key={idx} className="p-4 border-2 border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg">{day.day}</h3>
                    <span className="text-sm text-gray-600">
                      {day.exercises.length} تمارين
                    </span>
                  </div>

                  {day.exercises.length > 0 ? (
                    <>
                      <div className="space-y-2 mb-3">
                        {day.exercises.map(exId => {
                          const exercise = selectedExercises.find(e => e.id === exId);
                          return exercise ? (
                            <div key={exId} className="text-sm bg-blue-50 p-2 rounded">
                              {exercise.name} - {exercise.sets} × {exercise.reps}
                            </div>
                          ) : null;
                        })}
                      </div>
                      <input
                        type="text"
                        value={day.sessionGoal}
                        onChange={(e) => {
                          const newSchedule = [...weeklySchedule];
                          newSchedule[idx].sessionGoal = e.target.value;
                          setWeeklySchedule(newSchedule);
                        }}
                        placeholder="هدف الجلسة..."
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">{day.sessionGoal}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm mb-2">ملاحظات إضافية للمريض</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                placeholder="مثال: تجنب الألم، توقف إذا شعرت بدوخة، اشرب ماء..."
              />
            </div>

            <button
              onClick={() => setStep('review')}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transform hover:scale-[1.02] transition-all"
            >
              التالي: مراجعة الخطة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Review step
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setStep('schedule')}
          className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow mb-6"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Activity className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h1 className="text-3xl mb-2">مراجعة الخطة العلاجية</h1>
            <p className="text-gray-600">راجع جميع التفاصيل قبل الحفظ</p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="mb-3">معلومات أساسية</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">الطبيب:</span>
                  <p className="font-medium">{doctorName}</p>
                </div>
                <div>
                  <span className="text-gray-600">رقم الملف:</span>
                  <p className="font-medium">{patientId}</p>
                </div>
                <div>
                  <span className="text-gray-600">المدة:</span>
                  <p className="font-medium">{durationWeeks} أسابيع</p>
                </div>
                <div>
                  <span className="text-gray-600">المفاصل:</span>
                  <p className="font-medium">{injuredJoints.join(', ')}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl">
              <h3 className="mb-3">التمارين المختارة ({selectedExercises.length})</h3>
              <div className="space-y-2">
                {selectedExercises.map(ex => (
                  <div key={ex.id} className="text-sm bg-white p-3 rounded">
                    <p className="font-medium">{ex.name}</p>
                    <p className="text-gray-600">
                      {ex.sets} مجموعات × {ex.reps} تكرار | سرعة: {ex.speed}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {notes && (
              <div className="bg-yellow-50 p-4 rounded-xl">
                <h3 className="mb-2">ملاحظات</h3>
                <p className="text-sm text-gray-700">{notes}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleCreatePlan}
            className="w-full py-5 bg-green-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-green-700 transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-6 h-6" />
            حفظ الخطة وإرسالها للمريض
          </button>
        </div>
      </div>
    </div>
  );
}