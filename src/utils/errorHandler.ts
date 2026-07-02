import { AxiosError } from 'axios';
import { ApiError } from '../types/api.types';

/**
 * Extract user-friendly error message from API error response
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        const apiError = error.response?.data as ApiError;

        if (apiError?.message) {
            // Handle array of messages
            if (Array.isArray(apiError.message)) {
                return apiError.message.join(', ');
            }
            return apiError.message;
        }

        // Handle network errors
        if (error.code === 'ERR_NETWORK') {
            return 'Unable to connect to the server. Please check your connection and ensure the backend is running.';
        }

        // Handle timeout
        if (error.code === 'ECONNABORTED') {
            return 'Request timeout. Please try again.';
        }

        // Generic HTTP error
        return error.message || 'An unexpected error occurred';
    }

    // Handle non-Axios errors
    if (error instanceof Error) {
        return error.message;
    }

    return 'An unexpected error occurred';
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
    if (error instanceof AxiosError) {
        return error.response?.status === 401;
    }
    return false;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
    if (error instanceof AxiosError) {
        return error.response?.status === 400;
    }
    return false;
}

/**
 * Check if error is a not found error
 */
export function isNotFoundError(error: unknown): boolean {
    if (error instanceof AxiosError) {
        return error.response?.status === 404;
    }
    return false;
}
