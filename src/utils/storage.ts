// Storage utilities for the AI-Powered Healthcare Platform

export interface GameResult {
  gameType: 'stroop' | 'reaction' | 'memory';
  score: number;
  maxScore: number;
  accuracy: number;
  avgReactionTime: number;
  timestamp: number;
}

export interface PhysicalResult {
  assessmentType: 'rom' | 'balance';
  joint?: string;
  value: number;
  normalRange?: { min: number; max: number };
  metrics?: Record<string, any>;
  timestamp: number;
}

export interface ScreeningReport {
  timestamp: number;
  results: Array<{
    joint: string;
    status: 'normal' | 'limited' | 'weak' | 'needs_correction';
    angle: number;
    normalRange: { min: number; max: number };
  }>;
  overallStatus: string;
  recommendations: string[];
}

export interface SARCFResult {
  timestamp: number;
  answers: Record<string, number>;
  totalScore: number;
  riskLevel: 'low' | 'high';
}

export interface FunctionalTestResult {
  testId: string;
  timestamp: number;
  value: number;
  measurementType: 'repetitions' | 'duration';
  distance?: number;
}

export interface SarcopeniaAssessment {
  timestamp: number;
  sarcfResult: SARCFResult;
  functionalTests: FunctionalTestResult[];
  overallRisk: 'low' | 'moderate' | 'high';
}

export interface QuestionnaireResult {
  id: string;
  type: 'lefs' | 'quickdash';
  score: number;
  maxScore: number;
  answers: Record<number, number>; // questionIndex -> score
  timestamp: number;
}

export interface Exercise {
  id: string;
  name: string;
  nameEn: string;
  joint: string;
  sets: number;
  reps: number;
  speed: 'slow' | 'medium' | 'fast';
  targetAngle: number;
  angleRange: { min: number; max: number };
  videoUrl?: string;
  instructions: string;
  category?: 'rom' | 'balance' | 'strength' | 'sarcopenia';
}

export interface DoctorPlan {
  id: string;
  patientId: string;
  doctorName: string;
  createdAt: number;
  startDate: number;
  durationWeeks: number;
  injuredJoints: string[];
  exercises: Exercise[];
  weeklySchedule: {
    day: string;
    exercises: string[]; // exercise IDs
    sessionGoal: string;
  }[];
  notes: string;
  status: 'active' | 'completed' | 'paused';
  includesSarcopenia?: boolean;
}

export interface TrainingSession {
  id: string;
  planId: string;
  exerciseId: string;
  date: number;
  setsCompleted: number;
  repsPerSet: number[];
  correctReps: number;
  incorrectReps: number;
  errors: {
    timestamp: number;
    errorType: string;
    message: string;
  }[];
  averageAccuracy: number;
  completed: boolean;
}

// Save game result
export function saveGameResult(result: GameResult): void {
  const key = 'gameResults';
  const existing = localStorage.getItem(key);
  const results = existing ? JSON.parse(existing) : [];
  results.push(result);
  localStorage.setItem(key, JSON.stringify(results));
}

// Get all game results
export function getGameResults(): GameResult[] {
  const key = 'gameResults';
  const existing = localStorage.getItem(key);
  return existing ? JSON.parse(existing) : [];
}

// Save physical assessment result
export function savePhysicalResult(result: PhysicalResult): void {
  const key = 'physicalResults';
  const existing = localStorage.getItem(key);
  const results = existing ? JSON.parse(existing) : [];
  results.push(result);
  localStorage.setItem(key, JSON.stringify(results));
}

// Get all physical results
export function getPhysicalResults(): PhysicalResult[] {
  const key = 'physicalResults';
  const existing = localStorage.getItem(key);
  return existing ? JSON.parse(existing) : [];
}

// Save screening report
export function saveScreeningResult(report: ScreeningReport): void {
  const key = 'screeningReports';
  const existing = localStorage.getItem(key);
  const reports = existing ? JSON.parse(existing) : [];
  reports.push(report);
  localStorage.setItem(key, JSON.stringify(reports));
}

// Get latest screening report
export function getLatestScreeningReport(): ScreeningReport | null {
  const key = 'screeningReports';
  const existing = localStorage.getItem(key);
  if (!existing) return null;
  const reports = JSON.parse(existing);
  return reports.length > 0 ? reports[reports.length - 1] : null;
}

// Get all screening reports
export function getScreeningReports(): ScreeningReport[] {
  const key = 'screeningReports';
  const existing = localStorage.getItem(key);
  return existing ? JSON.parse(existing) : [];
}

// Save doctor plan
export function saveDoctorPlan(plan: DoctorPlan): void {
  const key = 'doctorPlan';
  localStorage.setItem(key, JSON.stringify(plan));
}

// Get active doctor plan
export function getActiveDoctorPlan(): DoctorPlan | null {
  const key = 'doctorPlan';
  const existing = localStorage.getItem(key);
  if (!existing) return null;
  const plan = JSON.parse(existing);
  return plan.status === 'active' ? plan : null;
}

// Save training session
export function saveTrainingSession(session: TrainingSession): void {
  const key = 'trainingSessions';
  const existing = localStorage.getItem(key);
  const sessions = existing ? JSON.parse(existing) : [];
  sessions.push(session);
  localStorage.setItem(key, JSON.stringify(sessions));
}

// Get training sessions
export function getTrainingSessions(): TrainingSession[] {
  const key = 'trainingSessions';
  const existing = localStorage.getItem(key);
  return existing ? JSON.parse(existing) : [];
}

// Get sessions for specific exercise
export function getExerciseSessions(exerciseId: string): TrainingSession[] {
  return getTrainingSessions().filter(s => s.exerciseId === exerciseId);
}

// Analytics functions
export function getWeeklyStats() {
  const games = getGameResults();
  const physical = getPhysicalResults();
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const weeklyGames = games.filter(g => g.timestamp >= oneWeekAgo);
  const weeklyPhysical = physical.filter(p => p.timestamp >= oneWeekAgo);

  return {
    gamesPlayed: weeklyGames.length,
    physicalAssessments: weeklyPhysical.length,
    avgAccuracy: weeklyGames.length > 0
      ? weeklyGames.reduce((sum, g) => sum + g.accuracy, 0) / weeklyGames.length
      : 0,
    avgReactionTime: weeklyGames.length > 0
      ? weeklyGames.reduce((sum, g) => sum + g.avgReactionTime, 0) / weeklyGames.length
      : 0,
  };
}

export function getProgressData(days: number = 30) {
  const games = getGameResults();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recentGames = games.filter(g => g.timestamp >= cutoff);

  // Group by date
  const byDate: Record<string, GameResult[]> = {};
  recentGames.forEach(game => {
    const date = new Date(game.timestamp).toLocaleDateString();
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(game);
  });

  return Object.entries(byDate).map(([date, games]) => ({
    date,
    avgAccuracy: games.reduce((sum, g) => sum + g.accuracy, 0) / games.length,
    avgReactionTime: games.reduce((sum, g) => sum + g.avgReactionTime, 0) / games.length,
    gamesPlayed: games.length,
  }));
}

export function getCognitiveScores() {
  const games = getGameResults();
  const last30Days = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentGames = games.filter(g => g.timestamp >= last30Days);

  const byType: Record<string, GameResult[]> = {
    stroop: [],
    reaction: [],
    memory: [],
  };

  recentGames.forEach(game => {
    if (byType[game.gameType]) {
      byType[game.gameType].push(game);
    }
  });

  return Object.entries(byType).map(([type, games]) => {
    if (games.length === 0) return { type, score: 0, avgAccuracy: 0 };

    return {
      type,
      score: games.reduce((sum, g) => sum + g.score, 0) / games.length,
      avgAccuracy: games.reduce((sum, g) => sum + g.accuracy, 0) / games.length,
    };
  });
}

// Sarcopenia-specific functions
export function saveSarcopeniaAssessment(type: 'sarc-f' | 'functional', data: SARCFResult | FunctionalTestResult): void {
  if (type === 'sarc-f') {
    const key = 'sarcfResults';
    const existing = localStorage.getItem(key);
    const results = existing ? JSON.parse(existing) : [];
    results.push(data);
    localStorage.setItem(key, JSON.stringify(results));
  } else {
    const key = 'functionalTests';
    const existing = localStorage.getItem(key);
    const results = existing ? JSON.parse(existing) : [];
    results.push(data);
    localStorage.setItem(key, JSON.stringify(results));
  }
}

export function getLatestSARCFResult(): SARCFResult | null {
  const key = 'sarcfResults';
  const existing = localStorage.getItem(key);
  if (!existing) return null;
  const results = JSON.parse(existing);
  return results.length > 0 ? results[results.length - 1] : null;
}

export function getFunctionalTestResults(): FunctionalTestResult[] {
  const key = 'functionalTests';
  const existing = localStorage.getItem(key);
  return existing ? JSON.parse(existing) : [];
}

export function getSarcopeniaProgressData(testId: string) {
  const tests = getFunctionalTestResults();
  const filtered = tests.filter(t => t.testId === testId);

  return filtered.map(test => ({
    date: new Date(test.timestamp).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
    value: test.value,
    timestamp: test.timestamp,
  }));
}

// Questionnaire functions
export function saveQuestionnaireResult(result: QuestionnaireResult): void {
  const key = 'questionnaireResults';
  const existing = localStorage.getItem(key);
  const results = existing ? JSON.parse(existing) : [];
  results.push(result);
  localStorage.setItem(key, JSON.stringify(results));
}

export function getQuestionnaireResults(type?: 'lefs' | 'quickdash'): QuestionnaireResult[] {
  const key = 'questionnaireResults';
  const existing = localStorage.getItem(key);
  const results: QuestionnaireResult[] = existing ? JSON.parse(existing) : [];
  if (type) {
    return results.filter(r => r.type === type);
  }
  return results;
}