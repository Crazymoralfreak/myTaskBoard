import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useUserRole, Permission } from '../hooks/useUserRole';
import { Board } from '../types/board';

// Интерфейс контекста ролей
interface RoleContextType {
  isOwner: boolean;
  isAdmin: boolean;
  currentRole?: string;
  currentRoleId?: number;
  hasPermission: (permission: Permission) => boolean;
  canManageRoles: () => boolean;
  canManageMembers: () => boolean;
  canManageBoard: () => boolean;
  canManageColumns: () => boolean;
  canManageTasks: () => boolean;
  setCurrentBoard: (board: Board | null) => void;
  setCurrentUserId: (userId: number | undefined) => void;
}

// Создаем контекст
const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Свойства провайдера контекста
interface RoleProviderProps {
  children: ReactNode;
}

// Провайдер контекста
export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);
  
  // Используем хук для проверки ролей
  const userRoles = useUserRole(currentBoard, currentUserId);
  
  // Формируем значение контекста
  const contextValue: RoleContextType = {
    isOwner: userRoles.isOwner,
    isAdmin: userRoles.isAdmin,
    currentRole: userRoles.userRole,
    currentRoleId: userRoles.userRoleId,
    hasPermission: userRoles.hasPermission,
    canManageRoles: userRoles.canManageRoles,
    canManageMembers: userRoles.canManageMembers,
    canManageBoard: userRoles.canManageBoard,
    canManageColumns: userRoles.canManageColumns,
    canManageTasks: userRoles.canManageTasks,
    setCurrentBoard,
    setCurrentUserId
  };
  
  return (
    <RoleContext.Provider value={contextValue}>
      {children}
    </RoleContext.Provider>
  );
};

// Хук для использования контекста
export const useRoleContext = (): RoleContextType => {
  const context = useContext(RoleContext);
  
  if (context === undefined) {
    throw new Error('useRoleContext must be used within a RoleProvider');
  }
  
  return context;
}; 