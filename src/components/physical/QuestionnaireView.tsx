import { useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { saveQuestionnaireResult, type QuestionnaireResult } from '../../utils/storage';

export interface Question {
    id: number;
    text: string;
    textAr: string;
}

interface QuestionnaireViewProps {
    type: 'lefs' | 'quickdash';
    title: string;
    titleAr: string;
    description: string;
    questions: Question[];
    options: { value: number; label: string; labelAr: string }[];
    onBack: () => void;
    onComplete: () => void;
}

export function QuestionnaireView({
    type,
    title,
    titleAr,
    description,
    questions,
    options,
    onBack,
    onComplete,
}: QuestionnaireViewProps) {
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);

    const handleAnswer = (questionId: number, value: number) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const calculateScore = () => {
        const totalQuestions = questions.length;
        const answeredCount = Object.keys(answers).length;

        if (answeredCount < totalQuestions) {
            alert('يرجى الإجابة على جميع الأسئلة للحصول على نتيجة دقيقة.');
            return;
        }

        const sum = Object.values(answers).reduce((a, b) => a + b, 0);
        let calculatedScore = 0;

        if (type === 'lefs') {
            // LEFS: Sum (0-80). Higher is better function.
            // Max score is 80.
            // We want score out of 80, not percentage.
            calculatedScore = sum; // Keep raw score
        } else if (type === 'quickdash') {
            // QuickDASH: ((Sum / n) - 1) * 25
            // Lower is better (0 = no disability, 100 = most severe disability).
            // Our options are usually 1-5.
            // So sum ranges from 11 to 55 for 11 items.
            calculatedScore = ((sum / totalQuestions) - 1) * 25;
        }

        setScore(Math.round(calculatedScore));
        setShowResult(true);

        // Save result
        const result: QuestionnaireResult = {
            id: `${type}-${Date.now()}`,
            type,
            score: Math.round(calculatedScore),
            maxScore: 100,
            answers,
            timestamp: Date.now(),
        };
        saveQuestionnaireResult(result);
    };

    const progress = (Object.keys(answers).length / questions.length) * 100;

    if (showResult) {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
                        <h1 className="text-3xl mb-2">اكتمل التقييم</h1>
                        <p className="text-gray-600 mb-8">{titleAr}</p>

                        <div className="bg-blue-50 p-8 rounded-2xl mb-8">
                            <p className="text-gray-600 mb-2">النتيجة النهائية</p>
                            <div className="text-6xl font-bold text-blue-600 mb-2">
                                {type === 'lefs' ? `${score}/80` : `${score}%`}
                            </div>
                            <p className="text-sm text-gray-500">
                                {type === 'lefs'
                                    ? '(كلما زاد الرقم، زادت القدرة الوظيفية)'
                                    : '(كلما قلت النسبة، قلت الإعاقة - نتيجة أقل أفضل)'}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={onComplete}
                                className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                            >
                                إنهاء
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6 sticky top-4 z-10">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft className="w-6 h-6 text-gray-600" />
                        </button>
                        <div className="text-center">
                            <h2 className="font-bold text-gray-800">{titleAr}</h2>
                            <p className="text-xs text-gray-500 max-w-xs truncate">{description}</p>
                        </div>
                        <div className="w-10" /> {/* Spacer */}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-blue-500 h-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-1">
                        {Object.keys(answers).length} / {questions.length} مكتمل
                    </p>
                </div>

                {/* Questions List */}
                <div className="space-y-6 pb-24">
                    {questions.map((q, idx) => (
                        <div key={q.id} className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                    {idx + 1}
                                </span>
                                <div>
                                    <p className="text-lg font-medium text-gray-800 mb-1">{q.textAr}</p>
                                    <p className="text-sm text-gray-500">{q.text}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {options.map((opt) => (
                                    <label
                                        key={opt.value}
                                        className={`
                      flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${answers[q.id] === opt.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                            }
                    `}
                                    >
                                        <input
                                            type="radio"
                                            name={`q-${q.id}`}
                                            value={opt.value}
                                            checked={answers[q.id] === opt.value}
                                            onChange={() => handleAnswer(q.id, opt.value)}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="mr-3 flex-1 text-right">
                                            <span className="block font-medium text-gray-700">{opt.labelAr}</span>
                                            <span className="block text-xs text-gray-400">{opt.label}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Submit Button */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <div className="max-w-3xl mx-auto">
                        <button
                            onClick={calculateScore}
                            disabled={Object.keys(answers).length < questions.length}
                            className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2
                transition-all duration-300
                ${Object.keys(answers).length < questions.length
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl hover:scale-[1.02]'
                                }
              `}
                        >
                            <Save className="w-5 h-5" />
                            حساب النتيجة ({Object.keys(answers).length}/{questions.length})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

