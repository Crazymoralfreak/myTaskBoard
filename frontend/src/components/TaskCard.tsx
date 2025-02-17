import { Task } from '../types/task';
import { Card, CardContent, Typography, Box, Chip, Select, MenuItem, FormControl } from '@mui/material';
import { useState } from 'react';
import { taskService } from '../services/taskService';

interface TaskCardProps {
  task: Task;
  boardStatuses: Array<{id: number; name: string; color: string; isDefault: boolean; isCustom: boolean; position: number}>;
  onStatusChange?: (taskId: number, newStatus: number) => void;
}

export const TaskCard = ({ task, boardStatuses, onStatusChange }: TaskCardProps) => {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (statusId: number) => {
    if (loading) return;
    setLoading(true);
    try {
      const newStatus = boardStatuses.find(status => status.id === statusId);
      if (!newStatus) throw new Error('Status not found');
      
      await taskService.updateTask(task.id, { 
        customStatus: {
          id: newStatus.id,
          name: newStatus.name,
          color: newStatus.color,
          isDefault: newStatus.isDefault,
          isCustom: newStatus.isCustom,
          position: newStatus.position
        }
      });
      onStatusChange?.(task.id, statusId);
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6">{task.title}</Typography>
        <Typography variant="body2">{task.description}</Typography>
        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
          <Select
            value={task.customStatus?.id || ''}
            onChange={(e) => handleStatusChange(e.target.value as number)}
            disabled={loading}
            sx={{
              bgcolor: task.customStatus?.color || '#e0e0e0',
              '& .MuiSelect-select': {
                py: 0.5
              }
            }}
          >
            {boardStatuses.map((status) => (
              <MenuItem 
                key={status.id} 
                value={status.id}
                sx={{ 
                  bgcolor: status.color,
                  '&:hover': {
                    bgcolor: status.color,
                    filter: 'brightness(0.95)'
                  }
                }}
              >
                {status.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {task.priority && task.priority !== 'NONE' && (
          <Chip 
            label={task.priority} 
            color={
              task.priority === 'HIGH' ? 'error' :
              task.priority === 'MEDIUM' ? 'warning' : 
              task.priority === 'LOW' ? 'success' :
              'default'
            }
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </CardContent>
    </Card>
  );
}; 