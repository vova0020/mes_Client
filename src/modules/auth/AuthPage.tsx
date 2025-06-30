import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AuthPage.module.css';
import logo from '../../assets/logo2.png';
import logoIcon from '../../assets/logo.png';
import LoadingScreen from '../../componentsGlobal/LoadingScreen/index';
import authService, { AuthCredentials } from '../../services/authService';

const AuthPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const navigate = useNavigate();

  // При загрузке компонента проверяем, авторизован ли пользователь
  useEffect(() => {
    // console.log('=== AUTHPAGE USEEFFECT ПРОВЕРКА ===');
    const checkAuth = async () => {
      // console.log('Проверяем авторизацию при загрузке страницы...');
      // Если пользователь уже авторизован, перенаправляем его
      if (authService.isAuthenticated()) {
        // console.log('Пользователь уже авторизован, получаем данные...');
        const user = authService.getUser();
        const assignments = authService.getAssignments();
        // console.log('Данные пользователя:', user);
        // console.log('Assignments:', assignments);

        if (user && assignments) {
          // console.log('Определяем домашнюю страницу при загрузке...');
          const homePage = authService.determineHomePageWithSelectedStage();
          // console.log('Домашняя страница при загрузке:', homePage);
          navigate(homePage);
        }
      } else {
        // console.log('Пользовател�� не авторизован, показываем форму входа');
        // Если не авторизован, показываем форму входа после короткой загрузки
        setTimeout(() => {
          setLoading(false);
        }, 2500);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    // console.log('=== ОТПРАВКА ФОРМЫ АВТОРИЗАЦИИ ===');
    event.preventDefault();
    setError('');

    if (!username || !password) {
      // console.log('Не заполнены поля username или password');
      setError('Пожалуйста, заполните все поля');
      return;
    }

    // console.log('Начинаем процесс авторизации для пользователя:', username);
    setIsSubmitting(true);

    try {
      const credentials: AuthCredentials = { username, password };
      // console.log('Вызываем authService.login...');
      const authData = await authService.login(credentials);

      // console.log('Авторизация успешна! Полученные данные:', authData);
      // console.log('Пользователь:', authData.user);
      // console.log('Роль пользователя:', authData.user.primaryRole);
      // console.log('Assignments:', authData.assignments);

      // Сохраняем данные авторизации
      // console.log('Сохраняем данные авторизации...');
      authService.saveAuthData(authData);

      // Перенаправляем пользователя на соответствующую страницу
      // console.log('Определяем домашнюю страницу с учетом выбранного этапа...');
      const homePage = authService.determineHomePageWithSelectedStage();
      // console.log('Домашняя страница определена как:', homePage);
      navigate(homePage);
    } catch (error) {
      console.error('Ошибка при авторизации:', error);
      if (error instanceof Error) {
        setError(error.message || 'Неверный логин или пароль. Пожалуйста, проверьте введенные данные.');
      } else {
        setError('Произошла ошибка при входе в систему');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Функция для очистки ошибки при изменении полей ввода
  const clearError = () => {
    if (error) {
      setError('');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <LoadingScreen isLoading={loading} />

      <div className={styles.logoContainer}>
        <img src={logoIcon} alt="Наш логотип" className={styles.logo} />
        <img src={logo} alt="Наш текст" className={styles.logo} />
      </div>
      {/* <p>raskroy_op1</p>
      <p>raskroy_op2</p>
      <p>pokleyka_op1</p>
      <p>pokleyka_op2</p>
      <p>prisadka_op1</p>
      <p>prisadka_op2</p>
      <p>raskroy_master</p>
      <p>pokleyka_master</p>
      <p>prisadka_master</p>

      <p>packaging_master</p>
      <p>packaging_assembler</p>
      <p>packaging_operator</p>
      <p>пароль у всех :12345</p> */}



      <div className={styles.loginFormContainer}>
        <h1 className={styles.loginTitle}>АВТОРИЗАЦИЯ</h1>
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {/* Отображение ошибки, если она есть */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="username">Логин</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                clearError();
              }}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Пароль</label>
            <div className={styles.passwordInputContainer}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={styles.passwordToggle}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button type="submit" className={styles.loginButton} disabled={isSubmitting}>
            {isSubmitting ? 'ВХОД...' : 'ВОЙТИ'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
