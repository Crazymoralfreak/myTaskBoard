import React, { useState } from 'react';
import './AuthPage.css';


export const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ email: '', password: '', name: '' });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Вход выполнен: ' + JSON.stringify(loginData));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Регистрация выполнена: ' + JSON.stringify(registerData));
  };

  return (
    <div className="auth-page">
      <h1>Авторизация</h1>
      <div className="tabs">
        <button
          className={activeTab === 'login' ? 'active' : ''}
          onClick={() => setActiveTab('login')}
        >
          Вход
        </button>
        <button
          className={activeTab === 'register' ? 'active' : ''}
          onClick={() => setActiveTab('register')}
        >
          Регистрация
        </button>
      </div>
      {activeTab === 'login' && (
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={loginData.email}
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            required
          />
          <button type="submit">Войти</button>
        </form>
      )}
      {activeTab === 'register' && (
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Имя"
            value={registerData.name}
            onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={registerData.email}
            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={registerData.password}
            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
            required
          />
          <button type="submit">Зарегистрироваться</button>
        </form>
      )}
    </div>
  );
};