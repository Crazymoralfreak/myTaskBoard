import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { fetchTask } from '../api/api';
import { TaskHistory } from '../components/TaskHistory';

export const TaskPage = () => {
  const { taskId } = useParams();
  const { user, WebApp } = useTelegram();
  const [task, setTask] = useState<any>(null);

  useEffect(() => {
    WebApp.ready();
    if (taskId && user) {
      fetchTask(taskId).then((data) => setTask(data));
    }
  }, [taskId, user, WebApp]);

  if (!task) {
    return <div>Загрузка...</div>;
  }

  return (
    <div>
      <h1>{task.title}</h1>
      <p>{task.description}</p>
      <p>Статус: {task.status}</p>
      <p>Срок: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Не указан'}</p>
      <TaskHistory taskId={taskId!} />
    </div>
  );
};