import { User } from './user'; // Используем существующий тип User

export interface AuditLog {
    id: number;
    user?: User; // Может быть null для системных действий
    username: string; // Имя пользователя на момент действия, или "SYSTEM"
    action: string;
    entityType: string;
    entityId: string;
    details?: Record<string, any>; // JSONB поле, может иметь любую структуру
    ipAddress?: string;
    userAgent?: string;
    createdAt: string; // ISO date string
}

export interface AuditLogFilter {
    username?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    dateFrom?: string; // ISO date-time string (YYYY-MM-DDTHH:mm:ss)
    dateTo?: string;   // ISO date-time string
} 