import { api } from '../lib/axios';
import { v4 as uuidv4 } from 'uuid';
import {
    CreateRomAssessmentDto,
    CreateBalanceAssessmentDto,
    CreateSarcFDto,
    CreateFiveTstsDto,
    CreateMiniCogDto,
    CreateMmseDto,
    RomRecord,
    BalanceRecord,
    SarcfRecord,
    FiveTstsRecord,
    CognitiveRecord,
    PaginationDto,
} from '../types/api.types';

export const assessmentService = {
    // ========== ROM (Range of Motion) ==========
    /**
     * Submit a new ROM assessment
     */
    async createRom(data: Omit<CreateRomAssessmentDto, 'sessionId'>): Promise<RomRecord> {
        const payload: CreateRomAssessmentDto = {
            ...data,
            sessionId: uuidv4(),
        };
        const response = await api.post<RomRecord>('/assessment/rom', payload);
        return response.data;
    },

    /**
     * Get ROM assessment history
     */
    async getRomHistory(page = 1, limit = 10): Promise<RomRecord[]> {
        const response = await api.get<RomRecord[]>('/assessment/rom/history', {
            params: { page, limit } as PaginationDto,
        });
        return response.data;
    },

    // ========== Balance ==========
    /**
     * Submit a new Balance assessment
     */
    async createBalance(data: CreateBalanceAssessmentDto): Promise<BalanceRecord> {
        const response = await api.post<BalanceRecord>('/assessment/balance', data);
        return response.data;
    },

    /**
     * Get Balance assessment history
     */
    async getBalanceHistory(page = 1, limit = 10): Promise<BalanceRecord[]> {
        const response = await api.get<BalanceRecord[]>('/assessment/balance/history', {
            params: { page, limit } as PaginationDto,
        });
        return response.data;
    },

    // ========== Sarcopenia - SARC-F ==========
    /**
     * Submit a new SARC-F questionnaire
     */
    async createSarcf(data: CreateSarcFDto): Promise<SarcfRecord> {
        const response = await api.post<SarcfRecord>('/assessment/sarcopenia/sarc-f', data);
        return response.data;
    },

    /**
     * Get SARC-F assessment history
     */
    async getSarcfHistory(page = 1, limit = 10): Promise<SarcfRecord[]> {
        const response = await api.get<SarcfRecord[]>('/assessment/sarcopenia/sarc-f/history', {
            params: { page, limit } as PaginationDto,
        });
        return response.data;
    },

    // ========== Sarcopenia - 5TSTS ==========
    /**
     * Submit a new 5 Times Sit-To-Stand test
     */
    async create5Tsts(data: CreateFiveTstsDto): Promise<FiveTstsRecord> {
        const response = await api.post<FiveTstsRecord>('/assessment/sarcopenia/5tsts', data);
        return response.data;
    },

    /**
     * Get 5TSTS assessment history
     */
    async get5TstsHistory(page = 1, limit = 10): Promise<FiveTstsRecord[]> {
        const response = await api.get<FiveTstsRecord[]>('/assessment/sarcopenia/5tsts/history', {
            params: { page, limit } as PaginationDto,
        });
        return response.data;
    },

    // ========== Cognitive ==========
    /**
     * Submit a new MMSE cognitive test
     */
    async createMmse(data: CreateMmseDto): Promise<CognitiveRecord> {
        const response = await api.post<CognitiveRecord>('/assessment/cognitive/mmse', data);
        return response.data;
    },

    /**
     * Submit a new Mini-Cog cognitive test
     */
    async createMiniCog(data: CreateMiniCogDto): Promise<CognitiveRecord> {
        const response = await api.post<CognitiveRecord>('/assessment/cognitive/mini-cog', data);
        return response.data;
    },

    /**
     * Get cognitive assessment history
     */
    async getCognitiveHistory(page = 1, limit = 10): Promise<CognitiveRecord[]> {
        const response = await api.get<CognitiveRecord[]>('/assessment/cognitive/history', {
            params: { page, limit } as PaginationDto,
        });
        return response.data;
    },
};
