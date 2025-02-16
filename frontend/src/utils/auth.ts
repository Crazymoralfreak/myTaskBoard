import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    sub: string;  // email пользователя
    id: number;   // id пользователя
    exp: number;
}

export const getAuthUser = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        const decoded = jwtDecode<DecodedToken>(token);
        return {
            id: decoded.id,
            email: decoded.sub
        };
    } catch (error) {
        console.error('Failed to decode token:', error);
        return null;
    }
}; 