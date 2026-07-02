import { api } from '../lib/axios';
import { PatientDashboard, PaginationDto } from '../types/api.types';

export const dashboardService = {
    /**
     * Get patient dashboard with latest assessments and training plan
     */
    async getPatientDashboard(): Promise<PatientDashboard> {
        const response = await api.get<PatientDashboard>('/dashboard/patient');
        return response.data;
    },

    /**
     * Get full patient history (Doctor view)
     */
    async getDoctorPatientView(patientId: string, page = 1, limit = 10): Promise<any> {
        const response = await api.get(`/dashboard/doctor/${patientId}`, {
            params: { page, limit } as PaginationDto,
        });
        return response.data;
    },
};
