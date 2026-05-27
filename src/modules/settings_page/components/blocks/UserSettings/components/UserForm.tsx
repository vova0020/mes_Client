import React, { useState, useEffect } from 'react';
import { useUser, useUsers, useCreateUser, useUpdateUser, useCreatePickerWithRole } from '../hooks/useUsersQuery';
import { CreateUserDto, UpdateUserDto } from '../services/usersApi';
import { ProductionType, PRODUCTION_TYPE_LABELS } from '@/types/production';
import styles from './UserForm.module.css';

interface UserFormProps {
  editId?: number;
  onSaved: () => void;
  onCancel: () => void;
}

interface FormData {
  login: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  position: string;
  salary: string;
  createPicker: boolean;
  productionType: ProductionType;
}

interface FormErrors {
  login?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  position?: string;
  salary?: string;
}

export const UserForm: React.FC<UserFormProps> = ({
  editId,
  onSaved,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormData>({
    login: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    position: '',
    salary: '',
    createPicker: false,
    productionType: ProductionType.BOTH,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { data: existingUser, isLoading: isLoadingUser } = useUser(editId);
  const { data: allUsers = [] } = useUsers(); // Для проверки дублирования логинов
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const createPickerWithRoleMutation = useCreatePickerWithRole();

  const isEditing = !!editId;
  const title = isEditing ? 'Редактировать пользователя' : 'Создать пользователя';

  // Заполняем форму данными существующего пользователя при редактировании
  useEffect(() => {
    if (isEditing && existingUser) {
      setFormData({
        login: existingUser.login,
        password: '', // Пароль не показываем
        firstName: existingUser.userDetail.firstName,
        lastName: existingUser.userDetail.lastName,
        phone: existingUser.userDetail.phone || '',
        position: existingUser.userDetail.position || '',
        salary: existingUser.userDetail.salary?.toString() || '',
        createPicker: false, // При редактировании не показываем опцию создания комплектовщика
        productionType: existingUser.productionType || ProductionType.BOTH,
      });
    }
  }, [isEditing, existingUser]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Валидация логина
    if (!formData.login.trim()) {
      newErrors.login = 'Логин обязателен';
    } else if (formData.login.length < 3) {
      newErrors.login = 'Логин должен содержать минимум 3 символа';
    } else if (formData.login.length > 50) {
      newErrors.login = 'Логин не должен превышать 50 символов';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.login)) {
      newErrors.login = 'Логин может содержать только буквы, цифры, дефис и подчеркивание';
    } else {
      // Проверка на дублирование логинов
      const loginExists = allUsers.some(user => 
        user.login.toLowerCase() === formData.login.trim().toLowerCase() && 
        (!isEditing || user.userId !== editId)
      );
      if (loginExists) {
        newErrors.login = 'Пользователь с таким логином уже существует';
      }
    }

    // Валидация пароля (только при создании или если поле заполнено)
    if (!isEditing || formData.password.trim()) {
      if (!formData.password.trim()) {
        newErrors.password = 'Пароль обязателен';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Пароль должен содержать минимум 6 символов';
      } else if (formData.password.length > 100) {
        newErrors.password = 'Пароль не должен превышать 100 символов';
      }
    }

    // Валидация имени
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Имя обязательно';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'Имя должно содержать минимум 2 символа';
    } else if (formData.firstName.length > 50) {
      newErrors.firstName = 'Имя не должно превышать 50 символов';
    }

    // Валидация фамилии
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Фамилия обязательна';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Фамилия должна содержать минимум 2 символа';
    } else if (formData.lastName.length > 50) {
      newErrors.lastName = 'Фамилия не должна превышать 50 символов';
    }

    // Валидация телефона (опционально)
    if (formData.phone.trim() && !/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s|-/g, ''))) {
      newErrors.phone = 'Неверный формат телефона';
    }

    // Валидация должности (опционально)
    if (formData.position.trim() && formData.position.length > 100) {
      newErrors.position = 'Должность не должна превышать 100 символов';
    }

    // Валидация зарплаты (опционально)
    if (formData.salary.trim()) {
      const salaryValue = parseFloat(formData.salary);
      if (isNaN(salaryValue)) {
        newErrors.salary = 'Зарплата должна быть числом';
      } else if (salaryValue < 0) {
        newErrors.salary = 'Зарплата не может быть отрицательной';
      } else if (salaryValue > 10000000) {
        newErrors.salary = 'Зарплата не может превышать 10,000,000';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Очищаем ошибку для этого поля при изменении (только для строковых полей)
    if (typeof value === 'string' && errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const userData: any = {
        login: formData.login.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        productionType: formData.productionType,
      };

      // Добавляем пароль если он указан
      if (formData.password.trim()) {
        userData.password = formData.password;
      }

      // Добавляем опциональные поля только если они заполнены
      if (formData.phone.trim()) {
        userData.phone = formData.phone.trim();
      }
      
      if (formData.position.trim()) {
        userData.position = formData.position.trim();
      }
      
      // Исправленная обработка зарплаты
      if (formData.salary.trim()) {
        const salaryValue = parseFloat(formData.salary);
        if (!isNaN(salaryValue)) {
          userData.salary = salaryValue; // Отправляем как число, а не строку
        }
      }

      console.log('Отправляемые данные:', userData);

      let createdUser;

      if (isEditing && editId) {
        const updatedUser = await updateMutation.mutateAsync({
          id: editId,
          data: userData as UpdateUserDto,
        });
        console.log('Пользователь успешно обновлен:', updatedUser);
      } else {
        createdUser = await createMutation.mutateAsync(userData as CreateUserDto);
        console.log('Пользователь успешно создан:', createdUser);

        // Если выбрано создание комплектовщика, создаем его после создания пользователя
        if (formData.createPicker && createdUser) {
          try {
            console.log('Создаем комплектовщика для пользователя:', createdUser.userId);
            const pickerResponse = await createPickerWithRoleMutation.mutateAsync({
              userId: createdUser.userId,
              assignRole: true, // Автоматически назначаем роль комплектовщика
            });
            console.log('Комплектовщик успешно создан:', pickerResponse);
          } catch (pickerError: any) {
            console.error('Ошибка создания комплектовщика:', pickerError);
            // Показываем предупреждение, но не блокируем завершение создания пользователя
            alert(`Пользователь создан, но произошла ошибка при создании комплектовщика: ${pickerError.message}`);
          }
        }
      }

      onSaved();
    } catch (error: any) {
      console.error('Ошибка сохранения пользователя:', error);
      
      // Показываем ошибку пользователю
      if (error.response?.data?.message) {
        const errorMessage = Array.isArray(error.response.data.message) 
          ? error.response.data.message.join(', ')
          : error.response.data.message;
        alert(`Ошибка: ${errorMessage}`);
      } else if (error.message) {
        alert(`Ошибка: ${error.message}`);
      } else {
        alert('Произошла ошибка при сохранении пользователя. Попробуйте еще раз.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && isLoadingUser) {
    return (
      <div className={styles.form}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка данных пользователя...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <button onClick={onCancel} className={styles.closeButton}>
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.formContent}>
        {/* Логин */}
        <div className={styles.field}>
          <label htmlFor="login" className={styles.label}>
            Логин *
          </label>
          <input
            id="login"
            type="text"
            value={formData.login}
            onChange={(e) => handleInputChange('login', e.target.value)}
            className={`${styles.input} ${errors.login ? styles.inputError : ''}`}
            placeholder="Введите логин"
            maxLength={50}
          />
          {errors.login && (
            <span className={styles.errorText}>{errors.login}</span>
          )}
        </div>

        {/* Пароль */}
        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>
            Пароль {isEditing ? '' : ' *'}
          </label>
          <div className={styles.passwordContainer}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              placeholder={isEditing ? 'Оставьте пустым, чтобы не менять' : 'Введите пароль'}
              maxLength={100}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.passwordToggle}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {errors.password && (
            <span className={styles.errorText}>{errors.password}</span>
          )}
        </div>

        {/* Имя */}
        <div className={styles.field}>
          <label htmlFor="firstName" className={styles.label}>
            Имя *
          </label>
          <input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
            placeholder="Введите имя"
            maxLength={50}
          />
          {errors.firstName && (
            <span className={styles.errorText}>{errors.firstName}</span>
          )}
        </div>

        {/* Фамилия */}
        <div className={styles.field}>
          <label htmlFor="lastName" className={styles.label}>
            Фамилия *
          </label>
          <input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
            placeholder="Введите фамилию"
            maxLength={50}
          />
          {errors.lastName && (
            <span className={styles.errorText}>{errors.lastName}</span>
          )}
        </div>

        {/* Телефон */}
        <div className={styles.field}>
          <label htmlFor="phone" className={styles.label}>
            Телефон
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
            placeholder="+7 (XXX) XXX-XX-XX"
          />
          {errors.phone && (
            <span className={styles.errorText}>{errors.phone}</span>
          )}
        </div>

        {/* Должность */}
        <div className={styles.field}>
          <label htmlFor="position" className={styles.label}>
            Должность
          </label>
          <input
            id="position"
            type="text"
            value={formData.position}
            onChange={(e) => handleInputChange('position', e.target.value)}
            className={`${styles.input} ${errors.position ? styles.inputError : ''}`}
            placeholder="Введите должность"
            maxLength={100}
          />
          {errors.position && (
            <span className={styles.errorText}>{errors.position}</span>
          )}
        </div>

        {/* Зарплата */}
        <div className={styles.field}>
          <label htmlFor="salary" className={styles.label}>
            Зарплата (руб.)
          </label>
          <input
            id="salary"
            type="number"
            min="0"
            max="10000000"
            step="1000"
            value={formData.salary}
            onChange={(e) => handleInputChange('salary', e.target.value)}
            className={`${styles.input} ${errors.salary ? styles.inputError : ''}`}
            placeholder="Введите зарплату"
          />
          {errors.salary && (
            <span className={styles.errorText}>{errors.salary}</span>
          )}
          <small className={styles.fieldHint}>
            Оставьте пустым, если зарплата не указана
          </small>
        </div>

        {/* Создать комплектовщика (только при создании нового пользователя) */}
        {!isEditing && (
          <div className={styles.field}>
            <div className={styles.checkboxContainer}>
              <input
                id="createPicker"
                type="checkbox"
                checked={formData.createPicker}
                onChange={(e) => handleInputChange('createPicker', e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="createPicker" className={styles.checkboxLabel}>
                <span className={styles.checkboxText}>
                  Создать комплектовщика
                </span>
                <small className={styles.checkboxHint}>
                  Автоматически создаст комплектовщика с назначенной ролью orderPicker
                </small>
              </label>
            </div>
          </div>
        )}

        {/* Тип производства */}
        <div className={styles.field}>
          <label htmlFor="productionType" className={styles.label}>
            Тип производства *
          </label>
          <select
            id="productionType"
            value={formData.productionType}
            onChange={(e) => handleInputChange('productionType', e.target.value as ProductionType)}
            className={styles.select}
          >
            <option value={ProductionType.SERIAL}>{PRODUCTION_TYPE_LABELS[ProductionType.SERIAL]}</option>
            <option value={ProductionType.CUSTOM}>{PRODUCTION_TYPE_LABELS[ProductionType.CUSTOM]}</option>
            <option value={ProductionType.BOTH}>{PRODUCTION_TYPE_LABELS[ProductionType.BOTH]}</option>
          </select>
        </div>

        {/* Кнопки */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Отмена
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.submitSpinner}></span>
                {isEditing ? 'Сохранение...' : 'Создание...'}
              </>
            ) : (
              isEditing ? 'Сохранить' : 'Создать'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};