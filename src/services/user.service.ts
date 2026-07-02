import { api } from '../lib/axios';
import { User, UpdateUserDto } from '../types/api.types';

export const userService = {
    /**
     * Get current user profile
     */
    async getProfile(): Promise<User> {
        const response = await api.get<User>('/users/profile');
        return response.data;
    },

    /**
     * Update current user profile
     */
    async updateProfile(data: UpdateUserDto): Promise<User> {
        const response = await api.patch<User>('/users/profile', data);
        return response.data;
    },
};
