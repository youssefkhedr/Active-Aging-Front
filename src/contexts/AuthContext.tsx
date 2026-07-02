import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { User, Role } from '../types/api.types';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    sub: string; // user id
    email: string;
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": string;
    exp: number;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string, age?: number, gender?: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from local storage
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
                setIsAuthenticated(true);
            } catch (e) {
                console.error('Failed to parse stored user', e);
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await authService.login(email, password);
            console.log('Login Response:', response); // Debug log

            if (response.accessToken) {
                localStorage.setItem('auth_token', response.accessToken);
                if (response.refreshToken) {
                    localStorage.setItem('refresh_token', response.refreshToken);
                }

                // Decode token to get user info
                const decoded = jwtDecode<DecodedToken>(response.accessToken);
                const roleString = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 'PATIENT';

                const user: User = {
                    id: decoded.sub,
                    email: decoded.email,
                    fullName: email.split('@')[0], // Fallback since token might not have name
                    role: roleString as Role
                };

                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Login failed details:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (email: string, password: string, fullName: string, age?: number, gender?: string) => {
        setIsLoading(true);
        console.log('Registering with:', { email, fullName, age, gender }); // Debug payload

        try {
            const response = await authService.register({ email, password, fullName, age, gender } as any);
            console.log('Register Response:', response); // Debug log

            if (response.accessToken) {
                localStorage.setItem('auth_token', response.accessToken);
                if (response.refreshToken) {
                    localStorage.setItem('refresh_token', response.refreshToken);
                }

                // Decode token
                const decoded = jwtDecode<DecodedToken>(response.accessToken);
                const roleString = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 'PATIENT';

                const user: User = {
                    id: decoded.sub,
                    email: decoded.email,
                    fullName: fullName,
                    role: roleString as Role
                };

                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Registration failed', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
