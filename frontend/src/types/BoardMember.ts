import { User } from './user';
import { RoleDto } from './role';

export interface BoardMemberDto {
    id: string;
    user: User; // Assuming User interface from user.ts is equivalent to UserDto
    role: RoleDto;
    boardId: string;
    joinedAt: string; // ISO 8601 date string, mapped from createdAt in BoardMember entity
} 