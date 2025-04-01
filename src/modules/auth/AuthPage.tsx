import React, { useState, useEffect } from 'react';
import styles from './AuthPage.module.css';
import logo from '../../assets/logo-Photoroom.png';
import LoadingScreen from '../../componentsGlobal/LoadingScreen/index';

const AuthPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500); // Show loading screen for 2.5 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Здесь реализуйте логику авторизации
    console.log("Пользователь:", username, "Пароль:", password);
  };

  return (
    <div className={styles.loginContainer}>
      {/* Using the LoadingScreen component */}
      <LoadingScreen isLoading={loading} />

      <div className={styles.logoContainer}>
        <img src={logo} alt="Наш логотип" className={styles.logo} />
      </div>
      <div className={styles.loginFormContainer}>
        <h1 className={styles.loginTitle}>АВТОРИЗАЦИЯ</h1>
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Логин</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.loginButton}>
            ВОЙТИ
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
