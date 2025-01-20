import { useEffect, useState } from 'react';
import { fetchTaskHistory } from '../api/api';

export const TaskHistory = ({ taskId }: { taskId: string }) => {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchTaskHistory(taskId).then((data) => setHistory(data));
  }, [taskId]);

  return (
    <div>
      <h3>История изменений</h3>
      <ul>
        {history.map((entry) => (
          <li key={entry.id}>
            <p>{entry.description}</p>
            <small>{new Date(entry.timestamp).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};