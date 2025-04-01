import React, { createContext, useState, useContext, useEffect } from 'react';

interface User {
    id: number;
    email: string;
    username: string;
    name: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // При инициализации проверяем, есть ли сохраненный пользователь в localStorage
        const checkAuth = async () => {
            try {
                const savedUser = localStorage.getItem('user');
                
                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                }
            } catch (err) {
                console.error('Auth check error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            setError(null);
            
            // Заглушка для авторизации (в реальном приложении здесь будет API запрос)
            // В демо версии просто имитируем успешный вход
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const mockUser: User = {
                id: 1,
                email,
                username: email.split('@')[0],
                name: email.split('@')[0],
                avatar: undefined
            };
            
            setUser(mockUser);
            localStorage.setItem('user', JSON.stringify(mockUser));
        } catch (err) {
            console.error('Login error:', err);
            setError('Ошибка авторизации. Проверьте email и пароль.');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAuthenticated: !!user,
                isLoading,
                error
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    
    return context;
}; 