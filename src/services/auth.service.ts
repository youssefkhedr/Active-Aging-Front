import { api } from '../lib/axios';
import { LoginDto, RegisterDto, AuthResponse } from '../types/api.types';

export const authService = {
    /**
     * Login user with email and password
     */
    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login', {
            email,
            password,
        } as LoginDto);
        return response.data;
    },

    /**
     * Register a new user
     */
    async register(data: RegisterDto): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/register', data);
        return response.data;
    },
};
