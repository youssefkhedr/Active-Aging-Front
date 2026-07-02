import { api } from '../lib/axios';
import { HealthCheckResponse } from '../types/api.types';

export const healthService = {
    /**
     * Check API health status
     * Uses a lightweight endpoint to verify connectivity
     */
    async checkHealth(): Promise<HealthCheckResponse> {
        const startTime = Date.now();

        try {
            // Try to hit a public endpoint that doesn't require auth
            await api.get('/weatherforecast', { timeout: 5000 });

            const latency = Date.now() - startTime;

            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                latency,
            };
        } catch (error) {
            console.warn('API health check failed:', error);

            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Perform a quick ping to check if API is reachable
     */
    async ping(): Promise<boolean> {
        try {
            const result = await this.checkHealth();
            return result.status === 'healthy';
        } catch {
            return false;
        }
    },
};
