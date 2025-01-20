import { useEffect, useState } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { fetchUserProfile } from '../api/api';

export const ProfilePage = () => {
  const { user, WebApp } = useTelegram();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    WebApp.ready();
    if (user) {
      fetchUserProfile(user.id).then((data) => setProfile(data));
    }
  }, [user, WebApp]);

  return (
    <div>
      <h1>Профиль</h1>
      {profile && (
        <div>
          <p>Имя: {profile.username}</p>
          <p>Email: {profile.email || 'Не указан'}</p>
          <p>Телефон: {profile.phone || 'Не указан'}</p>
        </div>
      )}
    </div>
  );
};