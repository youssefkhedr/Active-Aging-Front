import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Award, Calendar, Activity, Brain } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getGameResults, getPhysicalResults, getWeeklyStats, getProgressData, getCognitiveScores } from '../utils/storage';
import { dashboardService } from '../services/dashboard.service';

interface DashboardProps {
  onBack: () => void;
}

export function Dashboard({ onBack }: DashboardProps) {
  const [cognitiveData, setCognitiveData] = useState<any[]>([]);
  const [physicalData, setPhysicalData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // 1. Try to fetch from backend
    try {
      const dbData = await dashboardService.getPatientDashboard();

      // Seed summary with backend data
      setSummary({
        gamesPlayed: 0,
        avgAccuracy: 0,
        physicalAssessments: (dbData.latestRom ? 1 : 0) + (dbData.latestBalance ? 1 : 0),
        cognitiveGamesPlayed: dbData.latestCognitive ? 1 : 0,
        averageAccuracy: dbData.latestCognitive?.totalScore || 0,
        mostPlayedGame: 'stroop',
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data from backend:', error);
    }

    // 2. Load local data for details and charts
    const gameResults = getGameResults();
    const physicalResults = getPhysicalResults();
    const weeklyStats = getWeeklyStats();

    // Format data for charts
    const cognitiveChartData = gameResults.slice(-10).map((result, index) => ({
      index: index + 1,
      accuracy: result.accuracy,
      reactionTime: result.avgReactionTime,
      gameType: result.gameType,
      date: new Date(result.timestamp).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
    }));

    const physicalChartData = physicalResults.slice(-10).map((result, index) => ({
      index: index + 1,
      value: result.value,
      type: result.assessmentType,
      date: new Date(result.timestamp).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
    }));

    // Find most played game
    const gameCounts: Record<string, number> = {};
    gameResults.forEach(r => {
      gameCounts[r.gameType] = (gameCounts[r.gameType] || 0) + 1;
    });
    const mostPlayedGame = Object.keys(gameCounts).length > 0
      ? Object.entries(gameCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'stroop';

    setCognitiveData(cognitiveChartData);
    setPhysicalData(physicalChartData);

    // Finalize summary: prioritize local stats if more comprehensive, or merge
    setSummary((prev: any) => {
      if (!prev) return {
        ...weeklyStats,
        cognitiveGamesPlayed: weeklyStats.gamesPlayed,
        averageAccuracy: Math.round(weeklyStats.avgAccuracy),
        mostPlayedGame,
      };

      return {
        ...prev,
        gamesPlayed: Math.max(prev.gamesPlayed || 0, weeklyStats.gamesPlayed),
        physicalAssessments: Math.max(prev.physicalAssessments || 0, weeklyStats.physicalAssessments),
        mostPlayedGame,
      };
    });
  };

  const getGameNameArabic = (gameType: string) => {
    const names: { [key: string]: string } = {
      stroop: 'ستروب',
      reaction: 'سرعة الاستجابة',
      memory: 'الذاكرة',
    };
    return names[gameType] || gameType;
  };

  if (!summary) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-xl text-gray-600">جارٍ تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl">لوحة التحكم</h1>
            <p className="text-gray-600">Dashboard - متابعة التقدم والإحصائيات</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ألعاب معرفية</p>
                <p className="text-2xl">{summary.cognitiveGamesPlayed}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">هذا الأسبوع</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">تقييمات بدنية</p>
                <p className="text-2xl">{summary.physicalAssessments}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">هذا الأسبوع</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">متوسط الدقة</p>
                <p className="text-2xl">{summary.averageAccuracy}%</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">الألعاب المعرفية</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">الأكثر لعباً</p>
                <p className="text-lg">{getGameNameArabic(summary.mostPlayedGame)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">هذا الأسبوع</p>
          </div>
        </div>

        {/* Charts */}
        {cognitiveData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl mb-6">تطور الأداء المعرفي</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cognitiveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border">
                          <p className="text-sm mb-1">{payload[0].payload.date}</p>
                          <p className="text-sm">الدقة: {payload[0].value}%</p>
                          <p className="text-xs text-gray-600">
                            {getGameNameArabic(payload[0].payload.gameType)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend content={() => <p className="text-center text-sm text-gray-600 mt-4">الدقة (%)</p>} />
                <Line type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {physicalData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl mb-6">تطور الأداء البدني</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={physicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border">
                          <p className="text-sm mb-1">{payload[0].payload.date}</p>
                          <p className="text-sm">
                            {payload[0].payload.type === 'balance' ? 'مؤشر التوازن' : 'الزاوية'}: {payload[0].value}
                            {payload[0].payload.type === 'rom' ? '°' : ''}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend content={() => <p className="text-center text-sm text-gray-600 mt-4">القيمة</p>} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {cognitiveData.length === 0 && physicalData.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Activity className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl mb-2">لا توجد بيانات بعد</h3>
            <p className="text-gray-600 mb-6">
              ابدأ بممارسة الألعاب المعرفية أو التقييمات البدنية لرؤية تقدمك هنا
            </p>
            <button
              onClick={onBack}
              className="py-3 px-8 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              ابدأ الآن
            </button>
          </div>
        )}

        {/* Assessment History Section */}
        {(cognitiveData.length > 0 || physicalData.length > 0) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-slate-100">
            <h2 className="text-2xl mb-6 font-bold text-slate-800 underline-offset-4">سجل التقييمات المحفوظة</h2>
            <div className="space-y-3">
              {[...physicalData, ...cognitiveData].sort((a, b) => b.index - a.index).slice(0, 10).map((r, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${r.type ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      {r.type ? <Activity className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-bold text-lg text-slate-800">
                        {r.type === 'rom' ? 'تقييم المدى الحركي' :
                          r.type === 'balance' ? 'تقييم التوازن' :
                            getGameNameArabic(r.gameType)}
                      </p>
                      <p className="text-sm text-slate-500">{r.date}</p>
                    </div>
                  </div>
                  <div className="text-left font-black text-2xl text-slate-700">
                    {r.value !== undefined ? `${r.value}${r.type === 'rom' ? '°' : ''}` : `${r.accuracy}%`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}