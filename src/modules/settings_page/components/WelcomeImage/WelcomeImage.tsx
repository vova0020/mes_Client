import React, { useEffect, useState } from 'react';
import styles from './WelcomeImage.module.css';

interface ImageData {
  imageId: number;
  imageUrl: string;
  description?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const WelcomeImage: React.FC = () => {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadCurrentImage();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showMenu && !(e.target as Element).closest(`.${styles.menuBtn}, .${styles.menu}`)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  const loadCurrentImage = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/settings/images/current`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setImageData(data);
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
    }
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_URL}/settings/images/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      setImageData(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (file: File) => {
    if (!imageData) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_URL}/settings/images/${imageData.imageId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      setImageData(data);
    } catch (error) {
      console.error('Ошибка обновления:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!imageData || !confirm('Удалить изображение?')) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`${API_URL}/settings/images/${imageData.imageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setImageData(null);
    } catch (error) {
      console.error('Ошибка удаления:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      imageData ? handleUpdate(file) : handleUpload(file);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.imageWrapper}>
        {imageData ? (
          <>
            <img 
              src={`${API_URL}${imageData.imageUrl}`} 
              alt="Настройки" 
              className={styles.image}
            />
            <button 
              className={styles.menuBtn}
              onClick={() => setShowMenu(!showMenu)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="1" strokeWidth="2"/>
                <circle cx="12" cy="5" r="1" strokeWidth="2"/>
                <circle cx="12" cy="19" r="1" strokeWidth="2"/>
              </svg>
            </button>
            {showMenu && (
              <div className={styles.menu}>
                <label className={styles.menuItem}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    disabled={loading}
                  />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Изменить
                </label>
                <button 
                  className={`${styles.menuItem} ${styles.deleteItem}`}
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Удалить
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.placeholder}>
            <label className={styles.uploadBtn}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={loading}
              />
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Загрузить изображение</span>
            </label>
          </div>
        )}
        {loading && (
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeImage;
