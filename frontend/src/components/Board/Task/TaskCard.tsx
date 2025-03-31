const handleUpdateStatus = (statusId: number) => {
    if (!task) return;
    
    // Сохраняем старую колонку
    const updatedTask = {
        ...task,
        statusId,
        previousColumnId: task.columnId // Сохраняем предыдущую колонку для истории
    };
    
    taskService.updateTask(task.id, updatedTask)
        .then((updatedTask) => {
            console.log('Task status updated:', updatedTask);
            // Обновляем задачу в родительском компоненте
            if (onTaskUpdate) {
                onTaskUpdate(updatedTask);
            }
            // Закрываем меню
            setStatusMenuAnchorEl(null);
        })
        .catch((error) => {
            console.error('Error updating task status:', error);
            // Показываем сообщение об ошибке пользователю
            setErrorMessage('Не удалось обновить статус задачи');
        });
}; 