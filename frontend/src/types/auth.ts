export interface RegisterRequest {
    email: string;
    password: string;
    username?: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: number;
        email: string;
        username: string;
    };
    message: string;
}

export interface TelegramAuthRequest {
    telegramId: string;
    username: string;
    firstName?: string;
    lastName?: string;
} 