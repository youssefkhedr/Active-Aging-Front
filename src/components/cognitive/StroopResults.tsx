import { ArrowLeft, Brain, CheckCircle2, XCircle, Clock, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StroopResultsProps {
  onBack: () => void;
  results: {
    totalScore: number;
    maxScore: number;
    correctAnswers: number;
    wrongAnswers: number;
    totalQuestions: number;
    accuracy: number;
    avgResponseTime: number;
    responseTimes: number[];
    timestamps: number[];
    correctness: boolean[];
  };
}

export function StroopResults({ onBack, results }: StroopResultsProps) {
  // Calculate Performance Index (composite score)
  const calculatePerformanceIndex = () => {
    const accuracyScore = results.accuracy / 100; // 0-1
    const speedScore = Math.max(0, 1 - (results.avgResponseTime / 3)); // normalize to 0-1, assuming 3s is baseline
    const consistencyScore = calculateConsistency();
    
    const performanceIndex = ((accuracyScore * 0.5 + speedScore * 0.3 + consistencyScore * 0.2) * 100).toFixed(1);
    return parseFloat(performanceIndex);
  };

  const calculateConsistency = () => {
    if (results.responseTimes.length === 0) return 0;
    const mean = results.avgResponseTime;
    const variance = results.responseTimes.reduce((sum, rt) => sum + Math.pow(rt - mean, 2), 0) / results.responseTimes.length;
    const stdDev = Math.sqrt(variance);
    // Lower std dev = higher consistency
    return Math.max(0, 1 - (stdDev / mean));
  };

  const getPerformanceLevel = (index: number) => {
    if (index >= 80) return { label: 'تحكم انتباهي ممتاز', labelEn: 'Good Attention Control', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-500' };
    if (index >= 60) return { label: 'تحكم انتباهي جيد', labelEn: 'Moderate Attention', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-500' };
    if (index >= 40) return { label: 'صعوبة انتباه خفيفة', labelEn: 'Mild Attentional Difficulty', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-500' };
    return { label: 'بطء معالجة معلومات', labelEn: 'Slowed Processing Speed', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-500' };
  };

  const questionRate = (results.totalQuestions / (results.timestamps[results.timestamps.length - 1] - results.timestamps[0]) * 1000).toFixed(2);
  
  const performanceIndex = calculatePerformanceIndex();
  const performanceLevel = getPerformanceLevel(performanceIndex);

  // Prepare chart data - Response Quality Trend
  const qualityTrendData = results.timestamps.map((timestamp, idx) => {
    const relativeTime = ((timestamp - results.timestamps[0]) / 1000).toFixed(1);
    const isCorrect = results.correctness[idx];
    const responseTime = results.responseTimes[idx];
    
    // Quality score: correct answer with fast response = high quality
    let qualityScore = 0;
    if (isCorrect) {
      qualityScore = Math.max(0, 100 - (responseTime * 20)); // faster = higher score
    }
    
    return {
      time: parseFloat(relativeTime),
      quality: qualityScore,
      responseTime: responseTime,
    };
  });

  // Calculate historical average (simulated for demo)
  const historicalAverage = qualityTrendData.map(d => ({
    time: d.time,
    historicalQuality: 70, // simulated baseline
  }));

  // Merge data
  const combinedQualityData = qualityTrendData.map((d, idx) => ({
    ...d,
    historicalQuality: historicalAverage[idx]?.historicalQuality || 70,
  }));

  // Response Speed Trend data
  const speedTrendData = results.timestamps.map((timestamp, idx) => {
    const relativeTime = ((timestamp - results.timestamps[0]) / 1000).toFixed(1);
    return {
      time: parseFloat(relativeTime),
      current: results.responseTimes[idx],
      historical: results.avgResponseTime, // baseline
    };
  });

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow mb-6"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <Brain className="w-10 h-10 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl">نتائج اختبار Stroop</h1>
              <p className="text-gray-600">Stroop Test Results - Cognitive Performance Summary</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-50 border-r-4 border-yellow-500 p-4 rounded-xl mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium mb-1">تنبيه هام</p>
                <p className="text-sm text-gray-700">
                  هذا الاختبار أداة فحص معرفي وليس تشخيصاً طبياً.
                  النتائج تُستخدم للمتابعة والفحص فقط.
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  This test is a cognitive screening tool and not a medical diagnosis.
                </p>
              </div>
            </div>
          </div>

          {/* Performance Level Badge */}
          <div className={`${performanceLevel.bgColor} border-r-4 ${performanceLevel.borderColor} p-6 rounded-xl mb-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">مستوى الأداء المعرفي</p>
                <h2 className={`text-2xl ${performanceLevel.color}`}>{performanceLevel.label}</h2>
                <p className="text-sm text-gray-600 mt-1">{performanceLevel.labelEn}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">مؤشر الأداء</p>
                <p className={`text-5xl ${performanceLevel.color}`}>{performanceIndex}</p>
                <p className="text-sm text-gray-600">من 100</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Result Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total Score */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">النقاط</p>
                <p className="text-xs text-gray-500">Total Score</p>
              </div>
            </div>
            <p className="text-3xl text-purple-600">{results.totalScore}</p>
            <p className="text-sm text-gray-500">من {results.maxScore}</p>
          </div>

          {/* Accuracy */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">الدقة</p>
                <p className="text-xs text-gray-500">Accuracy</p>
              </div>
            </div>
            <p className="text-3xl text-green-600">{results.accuracy.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">{results.correctAnswers} من {results.totalQuestions}</p>
          </div>

          {/* Avg Response Time */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">متوسط الوقت</p>
                <p className="text-xs text-gray-500">Avg Time</p>
              </div>
            </div>
            <p className="text-3xl text-blue-600">{results.avgResponseTime.toFixed(2)}s</p>
            <p className="text-sm text-gray-500">Response Time</p>
          </div>

          {/* Question Rate */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">سرعة الإجابة</p>
                <p className="text-xs text-gray-500">Question Rate</p>
              </div>
            </div>
            <p className="text-3xl text-orange-600">{questionRate}</p>
            <p className="text-sm text-gray-500">سؤال/ثانية</p>
          </div>
        </div>

        {/* Correct vs Wrong Answers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">الإجابات الصحيحة</h3>
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-5xl text-green-600 mb-2">{results.correctAnswers}</p>
            <p className="text-sm text-gray-500">Correct Answers</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">الإجابات الخاطئة</h3>
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-5xl text-red-600 mb-2">{results.wrongAnswers}</p>
            <p className="text-sm text-gray-500">Wrong Answers</p>
          </div>
        </div>

        {/* Performance Visualization - Response Quality Trend */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl mb-4">📈 منحنى جودة الأداء</h3>
          <p className="text-sm text-gray-600 mb-6">Response Quality Trend - يوضح تقلبات الأداء خلال الاختبار</p>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={combinedQualityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                label={{ value: 'الوقت (ثانية)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'جودة الأداء', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="quality" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="الأداء الحالي"
                dot={{ fill: '#8b5cf6', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="historicalQuality" 
                stroke="#94a3b8" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="المعدل التاريخي"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-purple-50 p-3 rounded">
              <p className="text-purple-700 font-medium">الهدف: كشف التعب</p>
              <p className="text-gray-600 text-xs">Detect fatigue during test</p>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-blue-700 font-medium">الهدف: انخفاض الانتباه</p>
              <p className="text-gray-600 text-xs">Attention drops</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-green-700 font-medium">الهدف: عدم الاتساق</p>
              <p className="text-gray-600 text-xs">Inconsistency detection</p>
            </div>
          </div>
        </div>

        {/* Performance Visualization - Response Speed Trend */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl mb-4">📉 منحنى سرعة الاستجابة</h3>
          <p className="text-sm text-gray-600 mb-6">Response Speed Trend - يوضح سرعة الإجابة عبر الجلسة</p>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={speedTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                label={{ value: 'الوقت (ثانية)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'زمن الاستجابة (ثانية)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="current" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="الاختبار الحالي"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="historical" 
                stroke="#94a3b8" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="المتوسط التاريخي"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 bg-blue-50 p-4 rounded">
            <p className="text-blue-700 font-medium mb-1">💡 تفسير النتيجة</p>
            <p className="text-sm text-gray-700">
              الخط الأزرق يمثل أداءك الحالي. إذا كان الخط يرتفع = تباطؤ. إذا كان ينخفض = تحسن في السرعة.
            </p>
          </div>
        </div>

        {/* Clinical Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl mb-4">📋 ملخص طبي للجلسة</h3>
          <p className="text-sm text-gray-600 mb-4">Clinical Summary (For Doctor Review)</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600 mb-2">Performance Index</p>
              <p className="text-2xl text-purple-600">{performanceIndex}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600 mb-2">Accuracy %</p>
              <p className="text-2xl text-green-600">{results.accuracy.toFixed(1)}%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600 mb-2">Mean Reaction Time</p>
              <p className="text-2xl text-blue-600">{results.avgResponseTime.toFixed(2)}s</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600 mb-2">Error Rate</p>
              <p className="text-2xl text-red-600">{((results.wrongAnswers / results.totalQuestions) * 100).toFixed(1)}%</p>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border-r-4 border-blue-500 p-4 rounded">
            <h4 className="font-medium mb-2">🩺 استخدامات طبية</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• متابعة التحسن عبر الجلسات</li>
              <li>• مقارنة مع الخط القاعدي (Baseline)</li>
              <li>• تعديل شدة التدريب المعرفي</li>
              <li>• كشف مبكر لتدهور معرفي محتمل</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
