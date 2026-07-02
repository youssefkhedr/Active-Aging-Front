import { api } from '../lib/axios';
import { CreateTrainingPlanDto, TrainingPlan } from '../types/api.types';

export const trainingService = {
    /**
     * Get current training plan for patient
     */
    async getCurrentPlan(): Promise<TrainingPlan> {
        const response = await api.get<TrainingPlan>('/training-plan/current');
        return response.data;
    },

    /**
     * Create a new training plan (Doctor only)
     */
    async createPlan(data: CreateTrainingPlanDto): Promise<TrainingPlan> {
        const response = await api.post<TrainingPlan>('/doctor/training-plan', data);
        return response.data;
    },
};
