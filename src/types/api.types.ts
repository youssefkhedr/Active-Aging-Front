// API Types matching backend DTOs

export enum Role {
    PATIENT = 'PATIENT',
    DOCTOR = 'DOCTOR',
    ADMIN = 'ADMIN',
}

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
}

export enum CognitiveTestType {
    MMSE = 'MMSE',
    MINI_COG = 'MINI_COG',
}

// User Types
export interface User {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    age?: number;
    gender?: Gender;
    createdAt?: string;
    updatedAt?: string;
}

// Auth DTOs
export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    fullName: string;
    role?: Role;
    age?: number;
    gender?: Gender;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
}

export interface HealthCheckResponse {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    latency?: number;
}

// User DTOs
export interface UpdateUserDto {
    fullName?: string;
    age?: number;
    gender?: Gender;
}

// Assessment DTOs
export interface CreateRomAssessmentDto {
    jointType: string;
    maxAngle: number;
    minAngle: number;
    sessionId: string; // UUID
}

export interface CreateBalanceAssessmentDto {
    swayScore: number;
    stabilityIndex: number;
    testType: string;
}

export interface CreateSarcFDto {
    strength: number;
    walking: number;
    chairRise: number;
    stairs: number;
    falls: number;
}

export interface CreateFiveTstsDto {
    totalTimeSeconds: number;
    validReps: number;
}

export interface CreateMiniCogDto {
    clockResult: string;
    recallScore: number;
}

export interface CreateMmseDto {
    sectionScores: string; // JSON string or comma-separated? Swagger says string.
    totalScore: number;
    rawData?: any;
}

// Training Plan DTOs
export interface CreateTrainingPlanDto {
    patientId: string;
    title: string;
    description?: string;
    exercises: Exercise[];
    startDate?: string;
    endDate?: string;
}

export interface Exercise {
    name: string;
    sets?: number;
    reps?: number;
    duration?: number;
    instructions?: string;
}

// Pagination
export interface PaginationDto {
    page?: number;
    limit?: number;
}

// Response Types
export interface RomRecord {
    id: string;
    userId: string;
    jointType: string;
    maxAngle: number;
    minAngle: number;
    sessionId?: string;
    createdAt: string;
}

export interface BalanceRecord {
    id: string;
    userId: string;
    swayScore: number;
    stabilityIndex: number;
    testType: string;
    createdAt: string;
}

export interface SarcfRecord {
    id: string;
    userId: string;
    strength: number;
    walking: number;
    chairRise: number;
    stairs: number;
    falls: number;
    totalScore: number;
    createdAt: string;
}

export interface FiveTstsRecord {
    id: string;
    userId: string;
    totalTimeSeconds: number;
    validReps: number;
    createdAt: string;
}

export interface CognitiveRecord {
    id: string;
    userId: string;
    type: CognitiveTestType;
    totalScore?: number;
    recallScore?: number;
    clockResult?: string;
    rawData?: any;
    createdAt: string;
}

export interface TrainingPlan {
    id: string;
    patientId: string;
    doctorId: string;
    title: string;
    description?: string;
    exercises: Exercise[];
    startDate?: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PatientDashboard {
    latestRom?: RomRecord;
    latestBalance?: BalanceRecord;
    latestSarcf?: SarcfRecord;
    latest5Tsts?: FiveTstsRecord;
    latestCognitive?: CognitiveRecord;
    currentTrainingPlan?: TrainingPlan;
}

export interface ApiError {
    statusCode: number;
    message: string | string[];
    error?: string;
}
