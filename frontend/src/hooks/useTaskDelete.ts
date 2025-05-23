import { useState } from 'react';
import { taskService } from '../services/taskService';
import { toast } from 'react-hot-toast';

interface TaskDeleteCallbacks {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  onDeleteStart?: () => void;
}

export const useTaskDelete = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const deleteTask = async (taskId: number, callbacks?: TaskDeleteCallbacks) => {
    try {
      setIsDeleting(true);
      setError(null);
      
      callbacks?.onDeleteStart?.();
      
      const result = await taskService.deleteTask(taskId);
      
      toast.success('Задача успешно удалена');
      callbacks?.onSuccess?.();
      
      return result;
    } catch (error: any) {
      console.error('Ошибка при удалении задачи:', error);
      const errorMessage = error?.response?.data?.message || 'Не удалось удалить задачу';
      setError(errorMessage);
      toast.error(errorMessage);
      callbacks?.onError?.(error);
      
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };
  
  return { deleteTask, isDeleting, error };
}; 