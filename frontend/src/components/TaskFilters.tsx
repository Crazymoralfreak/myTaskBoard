import { useState } from 'react';

interface TaskFiltersProps {
  onFilter: (filters: { status: string; dueDate: string }) => void;
  onSort: (sortBy: string) => void;
}

export const TaskFilters = ({ onFilter, onSort }: TaskFiltersProps) => {
  const [statusFilter, setStatusFilter] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState('');

  const handleFilter = () => {
    onFilter({ status: statusFilter, dueDate: dueDateFilter });
  };

  return (
    <div>
      <h3>Фильтры и сортировка</h3>
      <div>
        <label>Статус:</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Все</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div>
        <label>Срок:</label>
        <input
          type="date"
          value={dueDateFilter}
          onChange={(e) => setDueDateFilter(e.target.value)}
        />
      </div>
      <button onClick={handleFilter}>Применить фильтры</button>
      <div>
        <label>Сортировать по:</label>
        <select onChange={(e) => onSort(e.target.value)}>
          <option value="dueDate">Сроку</option>
          <option value="status">Статусу</option>
          <option value="title">Названию</option>
        </select>
      </div>
    </div>
  );
};