import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useTelegram } from '../hooks/useTelegram';
import { fetchBoard, updateTaskPosition, sendTelegramNotification } from '../api/api';

export const BoardPage = () => {
  const { boardId } = useParams();
  const { user, WebApp } = useTelegram();
  const [board, setBoard] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    WebApp.ready();
    if (boardId && user) {
      fetchBoard(boardId).then((data) => setBoard(data));
    }
  }, [boardId, user, WebApp]);

  const onDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    const sourceColumn = board.columns.find((col: any) => col.id === source.droppableId);
    const destinationColumn = board.columns.find((col: any) => col.id === destination.droppableId);
    const task = sourceColumn.tasks.find((t: any) => t.id === draggableId);

    if (source.droppableId === destination.droppableId) {
      // Перемещение внутри одной колонки
      const newTasks = Array.from(sourceColumn.tasks);
      newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, task);

      const newColumn = { ...sourceColumn, tasks: newTasks };
      const newColumns = board.columns.map((col: any) =>
        col.id === newColumn.id ? newColumn : col
      );

      setBoard({ ...board, columns: newColumns });
    } else {
      // Перемещение между колонками
      const sourceTasks = Array.from(sourceColumn.tasks);
      sourceTasks.splice(source.index, 1);
      const newSourceColumn = { ...sourceColumn, tasks: sourceTasks };

      const destinationTasks = Array.from(destinationColumn.tasks);
      destinationTasks.splice(destination.index, 0, task);
      const newDestinationColumn = { ...destinationColumn, tasks: destinationTasks };

      const newColumns = board.columns.map((col: any) => {
        if (col.id === newSourceColumn.id) return newSourceColumn;
        if (col.id === newDestinationColumn.id) return newDestinationColumn;
        return col;
      });

      setBoard({ ...board, columns: newColumns });
    }

    // Обновление позиции задачи на бэкенде
    await updateTaskPosition({
      taskId: draggableId,
      sourceColumnId: source.droppableId,
      destinationColumnId: destination.droppableId,
      sourceIndex: source.index,
      destinationIndex: destination.index,
    });

    // Отправка уведомления
    const message = `Задача "${task.title}" перемещена из "${sourceColumn.title}" в "${destinationColumn.title}".`;
    await sendTelegramNotification(user.id, message);
  };

  if (!board) {
    return <div>Загрузка...</div>;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <h1>{board.title}</h1>
      <div style={{ display: 'flex', gap: '10px' }}>
        {board.columns.map((column: any) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px', width: '200px' }}
              >
                <h3>{column.title}</h3>
                {column.tasks.map((task: any, index: number) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          marginBottom: '10px',
                          padding: '5px',
                          background: '#f0f0f0',
                          borderRadius: '3px',
                          ...provided.draggableProps.style,
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/task/${task.id}`)}
                      >
                        <p>{task.title}</p>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};