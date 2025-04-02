import { UserSettings } from './settings';

export interface User {
    id: string;
    username: string;
    email: string;
    phone?: string;
    position?: string;
    bio?: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
} 