
/* Основные переменные */
:root {
  --primary-bg: #2C3E50;  /* Цвет фона страницы */
  --form-bg: rgba(255, 255, 255, 1);  /* Изменено на белый цвет */
  --form-text: rgba(40, 45, 75, 0.9);  /* Добавлен цвет текста - прежний цвет формы */
  --accent-color: #4f46e5;
  --input-bg: rgba(255, 255, 255, 1);  /* Белый фон для полей ввода */
  --input-border: rgba(40, 45, 75, 0.2); /* Цвет границы полей ввода */
  --text-color: rgba(40, 45, 75, 0.9); /* Изменен цвет текста на темно-синий */
  --error-color: #ef4444;
  --success-color: #10b981;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Глобальные стили */
:global(*),
:global(*::before),
:global(*::after) {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:global(body),
:global(html) {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Основной контейнер */
.loginContainer {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background: var(--primary-bg); /* Теперь используем одиночный цвет вместо градиента */
  color: var(--text-color);
  padding: 2rem 1rem;
  position: relative;
}

/* Контейнер для логотипов */
.logoContainer {
  position: relative;
  margin-bottom: 3rem;
  margin-top: -2rem;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: logoFloat 10s ease-in-out infinite;
}

/* Стили для логотипа (иконка) */
.logo:first-child {
  width: 100px;
  height: 100px;
  object-fit: contain;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.25));
  transition: var(--transition);
  transform-origin: center;
  /* Удаляем анимацию движения, оставляем только вращение */
  animation: logoRotate 3s linear infinite;
  margin-right: 15px;
  border-radius: 50%;
}

/* Стили для текста логотипа */
.logo:last-child {
  width: 210px; /* Конкретный размер для текста логотипа */
  height: auto; /* Автоматическая высота для сохранения пропорций */
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.25));
  transition: var(--transition);
}


/* Анимация плавающего движения для контейнера */
@keyframes logoFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Анимация вращения только для логотипа */
@keyframes logoRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}



/* Форма входа - изменен фон на белый */
.loginFormContainer {
  background: var(--form-bg);
  backdrop-filter: blur(10px);
  padding: 2.5rem;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 400px;
  border: 1px solid rgba(40, 45, 75, 0.1);
  /* Улучшенная тень для эффекта выпуклости */
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.8),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05);
  animation: formAppear 0.6s ease-out;
  position: relative;
  overflow: hidden;
  margin-top: 0;
}

.loginFormContainer::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 200%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.5),
    transparent
  );
  transition: 0.5s;
}

.loginFormContainer:hover::before {
  left: 100%;
}

/* Добавляем дополнительный псевдоэлемент для усиления эффекта выпуклости */
.loginFormContainer::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.5),
    rgba(255, 255, 255, 0.8),
    rgba(255, 255, 255, 0.5)
  );
}

@keyframes formAppear {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Заголовок - изменен цвет на темно-синий */
.loginTitle {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--form-text);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
}

/* Форма */
.loginForm {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Группы полей ввода - изменен цвет текста */
.formGroup {
  margin-bottom: 1.5rem;
}

.formGroup label {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: var(--form-text);
  font-weight: 600;
  transition: var(--transition);
}

.formGroup input {
  width: 100%;
  padding: 0.875rem;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 0.75rem;
  color: var(--text-color);
  font-size: 1rem;
  transition: var(--transition);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.formGroup input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
}

/* Контейнер поля пароля */
.passwordInputContainer {
  position: relative;
  display: flex;
  align-items: center;
}

.passwordInputContainer input {
  padding-right: 40px;
}

/* Кнопка переключения видимости пароля - изменен цвет */
.passwordToggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(40, 45, 75, 0.05);
  border: none;
  padding: 8px;
  cursor: pointer;
  color: var(--form-text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  border-radius: 50%;
}

.passwordToggle:hover {
  color: var(--accent-color);
  background: rgba(40, 45, 75, 0.1);
}

.passwordToggle:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--accent-color);
}

/* Кнопка входа - оставляем контрастной */
.loginButton {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--accent-color), #6366f1);
  border: none;
  border-radius: 0.75rem;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  /* Улучшенная тень для эффекта выпуклости */
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.4),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

.loginButton::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: 0.5s;
}

.loginButton:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 15px rgba(79, 70, 229, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.4),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

.loginButton:hover::before {
  left: 100%;
}

.loginButton:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px rgba(0, 0, 0, 0.1),
    inset 0 -1px 1px rgba(255, 255, 255, 0.1);
}

/* Состояния загрузки и ошибок */
.loginButton:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.formGroup input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.errorMessage {
  background: rgba(239, 68, 68, 0.1);
  color: #e53e3e;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.875rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Адаптивность */
@media (max-width: 480px) {
  .loginContainer {
    padding: 1rem;
  }

  .logoContainer {
    margin-top: 0; /* Сброс отрицательного отступа на мобильных */
  }

  /* Адаптивные стили для логотипов */
  .logo:first-child,
  .logo:last-child {
    width: auto;
    height: auto;
    max-width: 80px; /* Ограничение размера на мобильных */
  }

  .loginFormContainer {
    padding: 2rem 1.5rem;
  }

  .loginTitle {
    font-size: 1.25rem;
  }

  .formGroup input {
    padding: 0.75rem;
  }
}

/* Доступность */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}

/* Поддержка Firefox */
@-moz-document url-prefix() {
  .loginFormContainer {
    background: rgba(255, 255, 255, 0.98);
  }
}

/* Поддержка автозаполнения */
.formGroup input:-webkit-autofill,
.formGroup input:-webkit-autofill:hover,
.formGroup input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--text-color);
  -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.98) inset;
  transition: background-color 5000s ease-in-out 0s;
}

/* Улучшенная фокусировка для доступности */
.formGroup input:focus-visible,
.passwordToggle:focus-visible,
.loginButton:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

























Старые стили



/* Основные переменные */
:root {
  --primary-bg: #2C3E50;  /* Изменили цвет фона на запрошенный #2C3E50 */
  --form-bg: rgba(40, 45, 75, 0.9);  /* Более насыщенный и контрастный фон формы */
  --accent-color: #4f46e5;
  --input-bg: rgba(255, 255, 255, 0.07);  /* Более заметный фон полей ввода */
  --text-color: rgba(255, 255, 255, 0.95);
  --error-color: #ef4444;
  --success-color: #10b981;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Глобальные стили */
:global(*),
:global(*::before),
:global(*::after) {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:global(body),
:global(html) {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Основной контейнер */
.loginContainer {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background: var(--primary-bg); /* Теперь используем одиночный цвет вместо градиента */
  color: var(--text-color);
  padding: 2rem 1rem;
  position: relative;
}

/* Контейнер для логотипов */
.logoContainer {
  position: relative;
  margin-bottom: 3rem;
  margin-top: -2rem;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: logoFloat 10s ease-in-out infinite;
}

/* Стили для логотипа (иконка) */
.logo:first-child {
  width: 100px;
  height: 100px;
  object-fit: contain;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.25));
  transition: var(--transition);
  transform-origin: center;
  /* Удаляем анимацию движения, оставляем только вращение */
  animation: logoRotate 3s linear infinite;
  margin-right: 15px;
  border-radius: 50%;
}

/* Стили для текста логотипа */
.logo:last-child {
  width: 210px; /* Конкретный размер для текста логотипа */
  height: auto; /* Автоматическая высота для сохранения пропорций */
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.25));
  transition: var(--transition);
}


/* Анимация плавающего движения для контейнера */
@keyframes logoFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Анимация вращения только для логотипа */
@keyframes logoRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}



/* Форма входа - добавлен эффект выпуклости и улучшен контраст */
.loginFormContainer {
  background: var(--form-bg);
  backdrop-filter: blur(10px);
  padding: 2.5rem;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 400px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  /* Улучшенная тень для эффекта выпуклости */
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.2),
    inset 0 -1px 1px rgba(0, 0, 0, 0.2);
  animation: formAppear 0.6s ease-out;
  position: relative;
  overflow: hidden;
  margin-top: 0;
  /* Градиент для эффекта выпуклости */
  background-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(0, 0, 0, 0.05) 100%
  );
  background-blend-mode: overlay;
}

.loginFormContainer::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 200%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transition: 0.5s;
}

.loginFormContainer:hover::before {
  left: 100%;
}

/* Добавляем дополнительный псевдоэлемент для усиления эффекта выпуклости */
.loginFormContainer::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.05)
  );
}

@keyframes formAppear {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Заголовок - улучшена видимость */
.loginTitle {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Форма */
.loginForm {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Группы полей ввода - улучшена видимость */
.formGroup {
  margin-bottom: 1.5rem;
}

.formGroup label {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  transition: var(--transition);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.formGroup input {
  width: 100%;
  padding: 0.875rem;
  background: var(--input-bg);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.75rem;
  color: var(--text-color);
  font-size: 1rem;
  transition: var(--transition);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) inset;
}

.formGroup input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1) inset;
  background: rgba(255, 255, 255, 0.1);
}

/* Контейнер поля пароля */
.passwordInputContainer {
  position: relative;
  display: flex;
  align-items: center;
}

.passwordInputContainer input {
  padding-right: 40px;
}

/* Кнопка переключения видимости пароля - улучшена видимость */
.passwordToggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.05);
  border: none;
  padding: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  border-radius: 50%;
}

.passwordToggle:hover {
  color: white;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 8px rgba(79, 70, 229, 0.4);
}

.passwordToggle:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--accent-color);
}

/* Кнопка входа - улучшена видимость и добавлен эффект выпуклости */
.loginButton {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--accent-color), #6366f1);
  border: none;
  border-radius: 0.75rem;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  /* Улучшенная тень для эффекта выпуклости */
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.2),
    inset 0 1px 1px rgba(255, 255, 255, 0.4),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

.loginButton::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: 0.5s;
}

.loginButton:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 15px rgba(79, 70, 229, 0.4),
    inset 0 1px 1px rgba(255, 255, 255, 0.4),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

.loginButton:hover::before {
  left: 100%;
}

.loginButton:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 1px rgba(0, 0, 0, 0.1),
    inset 0 -1px 1px rgba(255, 255, 255, 0.1);
}

/* Состояния загрузки и ошибок */
.loginButton:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.formGroup input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.errorMessage {
  background: rgba(239, 68, 68, 0.15);
  color: #ff6b6b;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.875rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Адаптивность */
@media (max-width: 480px) {
  .loginContainer {
    padding: 1rem;
  }

  .logoContainer {
    margin-top: 0; /* Сброс отрицательного отступа на мобильных */
  }

  /* Адаптивные стили для логотипов */
  .logo:first-child,
  .logo:last-child {
    width: auto;
    height: auto;
    max-width: 80px; /* Ограничение размера на мобильных */
  }

  .loginFormContainer {
    padding: 2rem 1.5rem;
  }

  .loginTitle {
    font-size: 1.25rem;
  }

  .formGroup input {
    padding: 0.75rem;
  }
}

/* Доступность */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}

/* Поддержка Firefox */
@-moz-document url-prefix() {
  .loginFormContainer {
    background: rgba(40, 45, 75, 0.95);
  }
}

/* Поддержка автозаполнения */
.formGroup input:-webkit-autofill,
.formGroup input:-webkit-autofill:hover,
.formGroup input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--text-color);
  -webkit-box-shadow: 0 0 0px 1000px rgba(40, 45, 70, 0.9) inset;
  transition: background-color 5000s ease-in-out 0s;
}

/* Улучшенная фокусировка для доступности */
.formGroup input:focus-visible,
.passwordToggle:focus-visible,
.loginButton:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

