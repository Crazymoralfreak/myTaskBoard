import { useEffect, useState } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { fetchBoards, createBoard } from '../api/api';
import { useNavigate } from 'react-router-dom';

export const HomePage = () => {
  const { user, WebApp } = useTelegram();
  const [boards, setBoards] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    WebApp.ready();
    if (user) {
      fetchBoards(user.id).then((data) => setBoards(data));
    }
  }, [user, WebApp]);

  const handleCreateBoard = async () => {
    const title = prompt('Введите название доски:');
    if (title && user) {
      try {
        const newBoard = await createBoard({ title, userId: user.id });
        setBoards([...boards, newBoard]);
      } catch (error) {
        console.error('Error creating board:', error);
      }
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Мои доски</h1>
        <button onClick={handleProfileClick} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          👤
        </button>
      </div>
      <button onClick={handleCreateBoard}>Создать доску</button>
      <ul>
        {boards.map((board) => (
          <li key={board.id} onClick={() => navigate(`/board/${board.id}`)}>
            {board.title}
          </li>
        ))}
      </ul>
    </div>
  );
};