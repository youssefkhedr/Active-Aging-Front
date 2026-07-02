import { useState } from 'react';
import { ArrowLeft, ClipboardList, User } from 'lucide-react';
import { QuestionnaireView, type Question } from './QuestionnaireView';
import { ROMAssessment } from './ROMAssessment';

interface FunctionalAssessmentProps {
    onBack: () => void;
}

type AssessmentView = 'menu' | 'questionnaire' | 'bodypart';
type QuestionnaireType = 'lefs' | 'quickdash' | null;
type BodyPartType = 'spine' | 'shoulder' | 'elbow' | 'wrist' | 'ankle' | 'knee' | 'hip' | null;

export function FunctionalAssessment({ onBack }: FunctionalAssessmentProps) {
    const [currentView, setCurrentView] = useState<AssessmentView>('menu');
    const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<QuestionnaireType>(null);
    const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPartType>(null);

    const questionnaires = [
        {
            id: 'lefs' as QuestionnaireType,
            title: 'LEFS',
            titleAr: 'مقياس الأطراف السفلية الوظيفي',
            description: 'Lower Extremity Functional Scale',
            color: 'from-purple-500 to-purple-600',
        },
        {
            id: 'quickdash' as QuestionnaireType,
            title: 'QuickDASH',
            titleAr: 'مقياس الذراع والكتف واليد',
            description: 'Disabilities of Arm, Shoulder and Hand',
            color: 'from-indigo-500 to-indigo-600',
        },
    ];

    const bodyParts = [
        { id: 'spine' as BodyPartType, titleEn: 'Spine', titleAr: 'عمود فقري', color: 'bg-amber-400' },
        { id: 'shoulder' as BodyPartType, titleEn: 'Shoulder', titleAr: 'كتف', color: 'bg-amber-400' },
        { id: 'elbow' as BodyPartType, titleEn: 'Elbow', titleAr: 'كوع', color: 'bg-amber-400' },
        { id: 'wrist' as BodyPartType, titleEn: 'Wrist', titleAr: 'رسغ', color: 'bg-amber-400' },
        { id: 'hip' as BodyPartType, titleEn: 'Hip', titleAr: 'فخذ', color: 'bg-amber-400' },
        { id: 'knee' as BodyPartType, titleEn: 'Knee', titleAr: 'ركبة', color: 'bg-amber-400' },
        { id: 'ankle' as BodyPartType, titleEn: 'Ankle', titleAr: 'كاحل', color: 'bg-amber-400' },
    ];

    if (currentView === 'questionnaire' && selectedQuestionnaire) {
        const questionnaire = questionnaires.find(q => q.id === selectedQuestionnaire);

        let questions: Question[] = [];
        let options: { value: number; label: string; labelAr: string }[] = [];

        if (selectedQuestionnaire === 'lefs') {
            options = [
                { value: 4, label: 'No Difficulty', labelAr: 'لا توجد صعوبة' },
                { value: 3, label: 'A Little Bit of Difficulty', labelAr: 'صعوبة قليلة جداً' },
                { value: 2, label: 'Moderate Difficulty', labelAr: 'صعوبة متوسطة' },
                { value: 1, label: 'Quite a Bit of Difficulty', labelAr: 'صعوبة كبيرة' },
                { value: 0, label: 'Extreme Difficulty / Unable', labelAr: 'صعوبة شديدة / غير قادر' },
            ];
            questions = [
                { id: 1, text: 'Any of your usual work, housework, or school activities.', textAr: 'أي من أعمالك المعتادة، الأعمال المنزلية، أو الأنشطة المدرسية' },
                { id: 2, text: 'Your usual hobbies, recreational or sporting activities.', textAr: 'هواياتك المعتادة، الأنشطة الترفيهية أو الرياضية' },
                { id: 3, text: 'Getting into or out of the bath.', textAr: 'الدخول أو الخروج من حوض الاستحمام' },
                { id: 4, text: 'Walking between rooms.', textAr: 'المشي بين الغرف' },
                { id: 5, text: 'Putting on your shoes or socks.', textAr: 'ارتداء حذائك أو جواربك' },
                { id: 6, text: 'Squatting.', textAr: 'القرفصاء (Squatting)' },
                { id: 7, text: 'Lifting an object, like a bag of groceries from the floor.', textAr: 'رفع شيء، مثل كيس بقالة من الأرض' },
                { id: 8, text: 'Performing light activities around your home.', textAr: 'القيام بأنشطة خفيفة حول منزلك' },
                { id: 9, text: 'Performing heavy activities around your home.', textAr: 'القيام بأنشطة ثقيلة حول منزلك' },
                { id: 10, text: 'Getting into or out of a car.', textAr: 'الركوب أو الخروج من السيارة' },
                { id: 11, text: 'Walking 2 blocks.', textAr: 'المشي لمسافة حيين سكنيين (حوالي 200 متر)' },
                { id: 12, text: 'Walking a mile.', textAr: 'المشي لمسافة ميل (1.6 كم)' },
                { id: 13, text: 'Going up or down 10 stairs (about 1 flight of stairs).', textAr: 'صعود أو نزول 10 درجات سلم' },
                { id: 14, text: 'Standing for 1 hour.', textAr: 'الوقوف لمدة ساعة' },
                { id: 15, text: 'Sitting for 1 hour.', textAr: 'الجلوس لمدة ساعة' },
                { id: 16, text: 'Running on even ground.', textAr: 'الجري على أرض مستوية' },
                { id: 17, text: 'Running on uneven ground.', textAr: 'الجري على أرض غير مستوية' },
                { id: 18, text: 'Making sharp turns while running fast.', textAr: 'الانعطاف الحاد أثناء الجري السريع' },
                { id: 19, text: 'Hopping.', textAr: 'القفز (Hopping)' },
                { id: 20, text: 'Rolling over in bed.', textAr: 'التقلب في السرير' },
            ];
        } else if (selectedQuestionnaire === 'quickdash') {
            options = [
                { value: 1, label: 'No Difficulty', labelAr: 'لا توجد صعوبة' },
                { value: 2, label: 'Mild Difficulty', labelAr: 'صعوبة بسيطة' },
                { value: 3, label: 'Moderate Difficulty', labelAr: 'صعوبة متوسطة' },
                { value: 4, label: 'Severe Difficulty', labelAr: 'صعوبة شديدة' },
                { value: 5, label: 'Unable', labelAr: 'غير قادر' },
            ];
            questions = [
                { id: 1, text: 'Open a tight or new jar.', textAr: 'فتح برطمان جديد أو محكم الغلق' },
                { id: 2, text: 'Do heavy household chores (e.g., wash walls, floors).', textAr: 'القيام بأعمال منزلية ثقيلة (مسح الأرضيات، غسل الجدران)' },
                { id: 3, text: 'Carry a shopping bag or briefcase.', textAr: 'حمل حقيبة تسوق أو حقيبة يد' },
                { id: 4, text: 'Wash your back.', textAr: 'غسل ظهرك' },
                { id: 5, text: 'Use a knife to cut food.', textAr: 'استخدام سكين لتقطيع الطعام' },
                { id: 6, text: 'Recreational activities impacting arm/shoulder/hand (e.g., tennis).', textAr: 'أنشطة ترفيهية تتطلب قوة من الذراع/الكتف/اليد (مثل التنس)' },
                { id: 7, text: 'During the past week, extent your problem interfered with social activities?', textAr: 'خلال الأسبوع الماضي، إلى أي مدى تداخلت مشكلتك مع أنشطتك الاجتماعية؟' },
                { id: 8, text: 'During the past week, were you limited in your work/daily activities?', textAr: 'خلال الأسبوع الماضي، هل كنت محدوداً في عملك أو أنشطتك اليومية؟' },
                { id: 9, text: 'Arm, shoulder or hand pain.', textAr: 'شدة الألم في الذراع، الكتف أو اليد' },
                { id: 10, text: 'Tingling (pins and needles) in your arm, shoulder or hand.', textAr: 'تنميل (وخز) في ذراعك، كتفك أو يدك' },
                { id: 11, text: 'Difficulty sleeping because of pain in arm, shoulder or hand.', textAr: 'صعوبة في النوم بسبب الألم في الذراع، الكتف أو اليد' },
            ];
        }

        return (
            <QuestionnaireView
                type={selectedQuestionnaire}
                title={questionnaire?.title || ''}
                titleAr={questionnaire?.titleAr || ''}
                description={questionnaire?.description || ''}
                questions={questions}
                options={options}
                onBack={() => {
                    setCurrentView('menu');
                    setSelectedQuestionnaire(null);
                }}
                onComplete={() => {
                    setCurrentView('menu');
                    setSelectedQuestionnaire(null);
                }}
            />
        );
    }

    if (currentView === 'bodypart' && selectedBodyPart) {
        // Map body part to joint type
        let joint: any = 'shoulder';
        if (selectedBodyPart === 'shoulder') joint = 'shoulder';
        if (selectedBodyPart === 'knee') joint = 'knee';
        if (selectedBodyPart === 'hip') joint = 'hip';
        if (selectedBodyPart === 'ankle') joint = 'ankle';
        if (selectedBodyPart === 'spine') joint = 'spine';
        if (selectedBodyPart === 'elbow') joint = 'elbow';
        if (selectedBodyPart === 'wrist') joint = 'wrist';

        // Only render ROMAssessment for supported joints
        if (['shoulder', 'knee', 'hip', 'ankle', 'spine', 'elbow', 'wrist'].includes(joint)) {
            return <ROMAssessment onBack={() => {
                setCurrentView('menu');
                setSelectedBodyPart(null);
            }} initialJoint={joint} />;
        }

        const bodyPart = bodyParts.find(bp => bp.id === selectedBodyPart);
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => {
                                setCurrentView('menu');
                                setSelectedBodyPart(null);
                            }}
                            className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-3xl">{bodyPart?.titleAr}</h1>
                            <p className="text-gray-600">{bodyPart?.titleEn} Assessment</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <p className="text-gray-600 text-center">Body part assessment implementation coming soon...</p>
                    </div>
                </div>
            </div>
        );
    }

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
                        <h1 className="text-3xl">التقييم الوظيفي</h1>
                        <p className="text-gray-600">Functional Assessment</p>
                    </div>
                </div>

                {/* Questionnaires Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <ClipboardList className="w-8 h-8 text-purple-600" />
                        <h2 className="text-2xl">الاستبيانات</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {questionnaires.map((questionnaire) => (
                            <button
                                key={questionnaire.id}
                                onClick={() => {
                                    setSelectedQuestionnaire(questionnaire.id);
                                    setCurrentView('questionnaire');
                                }}
                                className={`
                  relative overflow-hidden rounded-2xl p-8 
                  bg-gradient-to-br ${questionnaire.color} 
                  text-white shadow-xl
                  transform transition-all duration-300 
                  hover:scale-105 hover:shadow-2xl
                  text-right
                `}
                            >
                                <ClipboardList className="w-12 h-12 mb-4 opacity-90" />
                                <h3 className="text-xl font-bold mb-2">{questionnaire.title}</h3>
                                <p className="text-sm opacity-90 mb-1">{questionnaire.titleAr}</p>
                                <p className="text-sm opacity-80">{questionnaire.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body Parts Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <User className="w-8 h-8 text-blue-600" />
                        <h2 className="text-2xl">أجزاء الجسم</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {bodyParts.map((bodyPart) => (
                            <button
                                key={bodyPart.id}
                                onClick={() => {
                                    setSelectedBodyPart(bodyPart.id);
                                    setCurrentView('bodypart');
                                }}
                                className={`
                  relative overflow-hidden rounded-xl p-6 
                  ${bodyPart.color} 
                  text-gray-900 shadow-lg
                  transform transition-all duration-300 
                  hover:scale-105 hover:shadow-xl
                  text-center
                `}
                            >
                                <h3 className="text-lg font-bold mb-1">{bodyPart.titleAr}</h3>
                                <p className="text-xs opacity-90">{bodyPart.titleEn}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
