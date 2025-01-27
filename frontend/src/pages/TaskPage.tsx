import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import axios from 'axios';
import { Task } from '../types';
import { useParams } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { fetchTask } from '../api/api';
import { TaskHistory } from '../components/TaskHistory';

export const TaskPage = () => {
  const { taskId } = useParams();
  const { user, WebApp } = useTelegram();
  const [task, setTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { register, handleSubmit, reset } = useForm<Task>();

  useEffect(() => {
    WebApp.ready();
    if (taskId && user) {
      fetchTask(taskId).then((data) => {
        setTask(data);
        reset(data);
      });
    }
  }, [taskId, user, WebApp, reset]);

  const onSubmit: SubmitHandler<Task> = async (data) => {
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, data);
      setTask(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  if (!task) {
    return <div>Загрузка...</div>;
  }

  return (
    <div>
      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label>Название:</label>
            <input {...register('title')} defaultValue={task.title} />
          </div>
          <div>
            <label>Описание:</label>
            <textarea {...register('description')} defaultValue={task.description} />
          </div>
          <div>
            <label>Статус:</label>
            <select {...register('status')} defaultValue={task.status}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label>Срок:</label>
            <input type="date" {...register('dueDate')} defaultValue={task.dueDate} />
          </div>
          <button type="submit">Сохранить</button>
          <button type="button" onClick={() => setIsEditing(false)}>Отмена</button>
        </form>
      ) : (
        <>
          <h1>{task.title}</h1>
          <p>{task.description}</p>
          <p>Статус: {task.status}</p>
          <p>Срок: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Не указан'}</p>
          <button onClick={() => setIsEditing(true)}>Редактировать</button>
          <TaskHistory taskId={taskId!} />
        </>
      )}
    </div>
  );
};
  