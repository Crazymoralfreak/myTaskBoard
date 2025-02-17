import { Task } from '../types/task';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';

interface TaskCardProps {
  task: Task;
}

export const TaskCard = ({ task }: TaskCardProps) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{task.title}</Typography>
        <Typography variant="body2">{task.description}</Typography>
        <Box sx={{ backgroundColor: task.customStatus?.color || '#e0e0e0' }}>
          <Typography variant="body2">
            {task.customStatus?.name || 'No Status'}
          </Typography>
        </Box>
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