import { useEffect, useState } from 'react';
import { fetchTaskHistory } from '../api/api';

interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  user: {
    name: string;
  };
}

export const TaskHistory = ({ taskId }: { taskId: string }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    fetchTaskHistory(taskId).then((data) => setHistory(data));
  }, [taskId]);

  const formatChange = (entry: HistoryEntry) => {
    if (entry.action === 'update') {
      return `Изменено поле "${entry.field}" с "${entry.oldValue}" на "${entry.newValue}"`;
    } else if (entry.action === 'create') {
      return `Задача создана`;
    } else if (entry.action === 'delete') {
      return `Задача удалена`;
    } else {
      return `Неизвестное действие`;
    }
  };

  return (
    <div>
      <h3>История изменений</h3>
      <ul>
        {history.map((entry) => (
          <li key={entry.id}>
            <p>{formatChange(entry)}</p>
            <small>
              {new Date(entry.timestamp).toLocaleString()} - {entry.user.name}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
};