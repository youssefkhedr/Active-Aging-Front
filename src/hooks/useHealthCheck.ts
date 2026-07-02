import { useState, useEffect } from 'react';
import { healthService } from '../services/health.service';
import { HealthCheckResponse } from '../types/api.types';

interface UseHealthCheckOptions {
    enabled?: boolean;
    interval?: number; // in milliseconds
}

export function useHealthCheck(options: UseHealthCheckOptions = {}) {
    const { enabled = true, interval = 60000 } = options; // Default: check every 60 seconds

    const [health, setHealth] = useState<HealthCheckResponse | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    const checkHealth = async () => {
        if (!enabled) return;

        setIsChecking(true);
        try {
            const result = await healthService.checkHealth();
            setHealth(result);
        } catch (error) {
            console.error('Health check error:', error);
            setHealth({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
            });
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        if (!enabled) return;

        // Initial check
        checkHealth();

        // Set up periodic checks
        const intervalId = setInterval(checkHealth, interval);

        return () => clearInterval(intervalId);
    }, [enabled, interval]);

    return {
        health,
        isHealthy: health?.status === 'healthy',
        isChecking,
        checkHealth,
    };
}
